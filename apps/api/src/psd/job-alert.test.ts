import { describe, it, expect, vi, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import {
  decideJobAlert,
  reportScheduledJobOutcome,
  jobAlertKey,
  JOB_ALERT_STATE_TTL,
  type JobAlertState,
} from "./job-alert";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { makeTestEnvLayer } from "../test-helpers/env-layer";

function makeCacheDouble() {
  const store = new Map<string, string>();
  const cache: KvCacheInterface = {
    get: (key) => Effect.sync(() => store.get(key) ?? null),
    set: (key, value) =>
      Effect.sync(() => {
        store.set(key, value);
      }),
    delete: (key) =>
      Effect.sync(() => {
        store.delete(key);
      }),
    increment: () => Effect.succeed(undefined),
  };
  return { cache, store };
}

/** Read back the persisted state the way `reportScheduledJobOutcome` writes it. */
function readState(
  store: Map<string, string>,
  job: string,
): JobAlertState | undefined {
  const raw = store.get(jobAlertKey(job));
  return raw === undefined ? undefined : (JSON.parse(raw) as JobAlertState);
}

function run(
  job: string,
  outcome: Parameters<typeof reportScheduledJobOutcome>[1],
  cache: KvCacheInterface,
  webhookUrl?: string,
) {
  return Effect.runPromise(
    reportScheduledJobOutcome(job, outcome).pipe(
      Effect.provide(Layer.succeed(KvCacheService, cache)),
      Effect.provide(makeTestEnvLayer({ SLACK_ALERT_WEBHOOK_URL: webhookUrl })),
    ),
  );
}

describe("decideJobAlert", () => {
  it("healthy + success: no alert, state unchanged", () => {
    const { next, alert } = decideJobAlert(
      { consecutiveFailures: 0, announced: false },
      true,
    );
    expect(alert).toBeNull();
    expect(next.consecutiveFailures).toBe(0);
  });

  it("healthy + failure: opens with a job-failure alert", () => {
    const { next, alert } = decideJobAlert(
      { consecutiveFailures: 0, announced: false },
      false,
    );
    expect(alert).toEqual({ kind: "job-failure" });
    expect(next.consecutiveFailures).toBe(1);
  });

  it("already failing and announced + failure: debounced — no alert, count still increments", () => {
    const { next, alert } = decideJobAlert(
      { consecutiveFailures: 3, announced: true },
      false,
    );
    expect(alert).toBeNull();
    expect(next.consecutiveFailures).toBe(4);
    expect(next.announced).toBe(true);
  });

  it("already failing but NOT YET announced + failure: alerts again (retry) — this is the fix, not the original bug", () => {
    // A previous failure alert never got a confirmed Slack POST — the streak
    // must keep trying, not silently debounce an outage nobody was told
    // about (#2870 review).
    const { next, alert } = decideJobAlert(
      { consecutiveFailures: 2, announced: false },
      false,
    );
    expect(alert).toEqual({ kind: "job-failure" });
    expect(next.consecutiveFailures).toBe(3);
  });

  it("already failing + success: recovers with a job-recovery alert and resets", () => {
    const { next, alert } = decideJobAlert(
      { consecutiveFailures: 6, announced: true },
      true,
    );
    expect(alert).toEqual({ kind: "job-recovery" });
    expect(next.consecutiveFailures).toBe(0);
  });
});

describe("reportScheduledJobOutcome", () => {
  const webhook = "https://hooks.slack.test/abc";

  afterEach(() => vi.unstubAllGlobals());

  it("no-ops (no fetch) when SLACK_ALERT_WEBHOOK_URL is absent, even on failure", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { cache } = makeCacheDouble();

    await run(
      "psd-sanity-sync",
      { ok: false, error: new Error("PSD 429") },
      cache,
      undefined,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a failure Slack message naming the job and the error on the first failure", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("ok"),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { cache, store } = makeCacheDouble();

    await run(
      "psd-sanity-sync",
      { ok: false, error: new Error("PSD 429") },
      cache,
      webhook,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      webhook,
      expect.objectContaining({
        body: expect.stringContaining("psd-sanity-sync"),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      webhook,
      expect.objectContaining({
        body: expect.stringContaining("PSD 429"),
      }),
    );
    expect(readState(store, "psd-sanity-sync")).toEqual({
      consecutiveFailures: 1,
      announced: true,
    });
  });

  it("seven consecutive nightly failures send fewer than seven Slack pings once the first one is confirmed delivered", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const { cache } = makeCacheDouble();

    for (let i = 0; i < 7; i++) {
      await run(
        "psd-sanity-sync",
        { ok: false, error: new Error("PSD 429") },
        cache,
        webhook,
      );
    }

    // Mirrors IncidentTracker's open/recover debounce: exactly one ping, on
    // the first failure — the remaining six are the same ongoing incident.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.length).toBeLessThan(7);
  });

  it("a dropped Slack POST on the first failure retries on the very next failure instead of debouncing forever", async () => {
    const fetchMock = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response("error", { status: 500 }))
      .mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const { cache, store } = makeCacheDouble();

    // Night 1: webhook 500s — the outage is NOT yet announced.
    await run(
      "psd-sanity-sync",
      { ok: false, error: new Error("PSD 429") },
      cache,
      webhook,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readState(store, "psd-sanity-sync")).toEqual({
      consecutiveFailures: 1,
      announced: false,
    });

    // Night 2: still failing, still not announced → retries, this time it lands.
    await run(
      "psd-sanity-sync",
      { ok: false, error: new Error("PSD 429") },
      cache,
      webhook,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readState(store, "psd-sanity-sync")).toEqual({
      consecutiveFailures: 2,
      announced: true,
    });

    // Night 3: now announced → debounced, no third POST.
    await run(
      "psd-sanity-sync",
      { ok: false, error: new Error("PSD 429") },
      cache,
      webhook,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a success after failures sends a recovery message and resets the counter", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("ok"),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { cache, store } = makeCacheDouble();

    for (let i = 0; i < 3; i++) {
      await run(
        "psd-sanity-sync",
        { ok: false, error: new Error("PSD 429") },
        cache,
        webhook,
      );
    }
    fetchMock.mockClear();

    await run("psd-sanity-sync", { ok: true }, cache, webhook);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      webhook,
      expect.objectContaining({
        body: expect.stringContaining("recovered"),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      webhook,
      expect.objectContaining({
        body: expect.stringContaining("3"),
      }),
    );
    expect(store.has(jobAlertKey("psd-sanity-sync"))).toBe(false);
  });

  it("a dropped recovery POST still resets the streak (best-effort, unlike the failure alert)", async () => {
    const fetchMock = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(new Response("ok")) // the failure alert lands
      .mockResolvedValueOnce(new Response("error", { status: 500 })); // recovery drops
    vi.stubGlobal("fetch", fetchMock);
    const { cache, store } = makeCacheDouble();

    await run(
      "psd-sanity-sync",
      { ok: false, error: new Error("PSD 429") },
      cache,
      webhook,
    );
    await run("psd-sanity-sync", { ok: true }, cache, webhook);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Reset regardless of delivery — a future failure starts a fresh streak.
    expect(store.has(jobAlertKey("psd-sanity-sync"))).toBe(false);
  });

  it("a success while already healthy sends nothing", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const { cache } = makeCacheDouble();

    await run("psd-sanity-sync", { ok: true }, cache, webhook);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tracks each job's streak independently", async () => {
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const { cache, store } = makeCacheDouble();

    await run(
      "psd-sanity-sync",
      { ok: false, error: new Error("x") },
      cache,
      webhook,
    );
    await run(
      "sanity-index-sync",
      { ok: false, error: new Error("y") },
      cache,
      webhook,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readState(store, "psd-sanity-sync")?.consecutiveFailures).toBe(1);
    expect(readState(store, "sanity-index-sync")?.consecutiveFailures).toBe(1);
  });

  it("JOB_ALERT_STATE_TTL comfortably outlives the daily cron interval", () => {
    expect(JOB_ALERT_STATE_TTL).toBeGreaterThan(24 * 60 * 60);
  });
});
