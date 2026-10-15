import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { PsdService, PsdServiceLive } from "./service";
import { PsdGateTest } from "./gate";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { noopDurableKv } from "../test-helpers/kv-cache-mock";
import { UpstreamUnavailableError } from "./errors";
import {
  SanityProjection,
  type SanityProjectionInterface,
} from "../sanity/projection";

global.fetch = vi.fn();

function makeEnvLayer() {
  return makeTestEnvLayer({
    SANITY_PROJECT_ID: "test-project",
    SANITY_WEBHOOK_SECRET: "",
  });
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  delete: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
  durable: noopDurableKv,
};

const sanityMock: SanityProjectionInterface = {
  getPlayersImageState: () => Effect.succeed(new Map()),
  getStaffImageState: () => Effect.succeed(new Map()),
  getActivePlayerPsdIds: () => Effect.succeed([]),
  getActiveStaffPsdIds: () => Effect.succeed([]),
  getActiveTeamPsdIds: () => Effect.succeed([]),
  getTeamPlayerPsdIds: () => Effect.succeed([]),
  getVisibleTeamPsdIds: () => Effect.succeed([]),
  getProtectedStaffPsdIds: () => Effect.succeed([]),
  getFormRoutingConfig: () => Effect.succeed(null),
};

const seasons = [
  {
    id: 42,
    name: "2024-2025",
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

function runGetTeamMatches(teamId: number) {
  const program = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getTeamMatches(teamId);
  });
  return Effect.runPromise(
    Effect.either(
      program.pipe(
        Effect.provide(PsdServiceLive),
        Effect.provide(PsdGateTest),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(Layer.succeed(SanityProjection, sanityMock)),
      ),
    ),
  );
}

describe("fetchJson typed error classification", () => {
  it("produces UpstreamUnavailableError on HTTP 429", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

    const result = await runGetTeamMatches(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
      expect((result.left as UpstreamUnavailableError).status).toBe(429);
    }
  });

  it("produces UpstreamUnavailableError on HTTP 500", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    const result = await runGetTeamMatches(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
      expect((result.left as UpstreamUnavailableError).status).toBe(500);
    }
  });

  it("produces UpstreamUnavailableError on network failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockRejectedValueOnce(new Error("Network error"));

    const result = await runGetTeamMatches(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });

  it("produces ResourceNotFoundError on HTTP 404", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

    const result = await runGetTeamMatches(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });

  it("produces UpstreamDecodeError on schema validation failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "not a match list" }),
      });

    const result = await runGetTeamMatches(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamDecode");
    }
  });
});

// ─── Per-fetch abort (#3489) ─────────────────────────────────────────────────

describe("fetchJson abort after 8 s (#3489)", () => {
  // A fetch that never resolves but honours its AbortSignal, like the real one.
  const hungFetch = (_url: unknown, init?: RequestInit) =>
    new Promise<never>((_resolve, reject) => {
      const signal = init?.signal;
      const abort = () => reject(signal?.reason ?? new Error("aborted"));
      if (signal?.aborted) abort();
      else signal?.addEventListener("abort", abort);
    });

  // `AbortSignal.timeout` runs on the runtime's own timer, which fake timers do
  // not reach — so hand the service a signal this test fires itself, and pin
  // the 8 000 ms it asked for.
  const fireTimeout = () => {
    const controller = new AbortController();
    const spy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(controller.signal);
    return {
      spy,
      fire: () =>
        controller.abort(new DOMException("timed out", "TimeoutError")),
    };
  };

  it("fails a PSD fetch that never resolves with UpstreamUnavailableError", async () => {
    const { spy, fire } = fireTimeout();
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockImplementationOnce(hungFetch);

    const pending = runGetTeamMatches(1);
    // Fire only once the service is waiting on the second (games) call.
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    fire();
    const result = await pending;

    expect(spy).toHaveBeenCalledWith(8_000);
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
    spy.mockRestore();
  });

  it("maps an abort that lands while the body streams to UpstreamUnavailableError, not a decode error", async () => {
    const { spy, fire } = fireTimeout();
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockImplementationOnce((url: unknown, init?: RequestInit) =>
        Promise.resolve({ ok: true, json: () => hungFetch(url, init) }),
      );

    const pending = runGetTeamMatches(1);
    // Fire only once the service is waiting on the second (games) call.
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    fire();
    const result = await pending;

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
    spy.mockRestore();
  });
});
