import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { PsdService, PsdServiceLive } from "./service";
import { WorkerEnvTag } from "../env";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { UpstreamUnavailableError } from "./errors";
import {
  SanityWriteClient,
  type SanityWriteClientInterface,
} from "../sanity/client";

global.fetch = vi.fn();

function makeEnvLayer() {
  return Layer.succeed(WorkerEnvTag, {
    PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
    PSD_IMAGE_BASE_URL: "https://kcvv.prosoccerdata.com",
    FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
    PSD_API_KEY: "test-key",
    PSD_API_CLUB: "test-club",
    PSD_API_AUTH: "test-auth",
    PSD_CACHE: {} as KVNamespace,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "test",
    SANITY_API_TOKEN: "test-token",
    SANITY_WEBHOOK_SECRET: "",
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
  });
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

const sanityMock: SanityWriteClientInterface = {
  upsertPlayer: () => Effect.succeed(undefined as void),
  upsertTeam: () => Effect.succeed(undefined as void),
  upsertStaff: () => Effect.succeed(undefined as void),
  uploadPlayerImage: () => Effect.succeed(undefined as void),
  getPlayersImageState: () => Effect.succeed(new Map()),
  getActivePlayerPsdIds: () => Effect.succeed([]),
  archivePlayers: () => Effect.succeed(undefined as void),
  getActiveStaffPsdIds: () => Effect.succeed([]),
  archiveStaff: () => Effect.succeed(undefined as void),
  getActiveTeamPsdIds: () => Effect.succeed([]),
  archiveTeams: () => Effect.succeed(undefined as void),
  writeFeedback: () => Effect.succeed(undefined as void),
  getVisibleTeamPsdIds: () => Effect.succeed([]),
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
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(Layer.succeed(SanityWriteClient, sanityMock)),
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
