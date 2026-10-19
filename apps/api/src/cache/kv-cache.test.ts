import { describe, it, expect, vi, afterEach } from "vitest";
import { Effect, Layer, Logger, LogLevel, Schema as S } from "effect";
import { IncidentTracker } from "../psd/incident";
import {
  KvCacheService,
  KvCacheLive,
  TypedKvCache,
  TTL,
  HARD_TTL_DEFAULT,
  HARD_TTL_LONG,
  BG_REFRESH_TIMEOUT_MS,
  MISS_FETCH_TIMEOUT_MS,
  NOT_FOUND_TTL,
  KvError,
  makeDurableKv,
} from "./kv-cache";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import type { WorkerEnv } from "../env";
import { ResourceNotFoundError, UpstreamUnavailableError } from "../psd/errors";
import { PsdGateService, PsdGateTest, makePsdGateLayer } from "../psd/gate";
import { GateLogic } from "../psd/gate-logic";
import { BackgroundRunnerService } from "../psd/background";
import { reportScheduledJobOutcome } from "../psd/job-alert";

/** `pageSize` caps how many keys `list` returns per call regardless of what
 * the caller asks for — real KV pages this way too, and the port's `list`
 * doesn't (and shouldn't) forward a `limit`, so a pagination test has to
 * force a small page from the mock's own side instead. */
function makeMockKv(options: { pageSize?: number } = {}) {
  const pageSize = options.pageSize ?? Infinity;
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(
      async (
        key: string,
        value: string,
        _options?: { expirationTtl?: number },
      ) => {
        store.set(key, value);
      },
    ),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(
      async ({ prefix, cursor }: { prefix?: string; cursor?: string } = {}) => {
        const matching = [...store.keys()]
          .filter((k) => k.startsWith(prefix ?? ""))
          .sort();
        const start = cursor ? Number(cursor) : 0;
        const page = matching.slice(start, start + pageSize);
        const nextStart = start + page.length;
        const complete = nextStart >= matching.length;
        return {
          keys: page.map((name) => ({ name })),
          list_complete: complete,
          cursor: complete ? undefined : String(nextStart),
          cacheStatus: null,
        };
      },
    ),
    store,
  };
}

function makeEnvLayer(
  mockKv: ReturnType<typeof makeMockKv>,
  overrides: Partial<WorkerEnv> = {},
) {
  return makeTestEnvLayer({
    PSD_CACHE: mockKv as unknown as KVNamespace,
    SANITY_PROJECT_ID: "test-project",
    SANITY_WEBHOOK_SECRET: "",
    ...overrides,
  });
}

const TestSchema = S.Struct({ name: S.String, value: S.Number });

/** Helper to create a cached wrapper entry */
function makeWrapper(value: unknown, ageMs: number) {
  return JSON.stringify({ value, fetchedAt: Date.now() - ageMs });
}

/**
 * A BackgroundRunnerService whose `fork` runs the refresh eagerly on the test
 * layers and records the promise, so a test can `await settle()` to observe
 * the background effect's outcome deterministically.
 */
function withRunner(
  mockKv: ReturnType<typeof makeMockKv>,
  gateLayer: Layer.Layer<PsdGateService>,
  /** Extra layers for the DETACHED work. The runner runs it on its own runtime,
   * so layers provided around `getOrFetch` never reach it — a log capture has
   * to come in through here. */
  extra: Layer.Layer<never> = Layer.empty,
) {
  const pending: Promise<void>[] = [];
  const layer = Layer.mergeAll(KvCacheLive, gateLayer, extra).pipe(
    Layer.provideMerge(makeEnvLayer(mockKv)),
  );
  const runnerLayer = Layer.succeed(BackgroundRunnerService, {
    fork: (_label, effect) =>
      Effect.sync(() => {
        // The test fetch is pure, so the refresh never touches PsdService —
        // `layer` satisfies its real deps (KvCache + gate + env).
        pending.push(
          Effect.runPromise(
            Effect.provide(effect, layer) as unknown as Effect.Effect<void>,
          ),
        );
      }),
  });
  return { runnerLayer, settle: () => Promise.all(pending) };
}

/** Fresh gate with its OWN incident tracker so state can't leak between tests. */
const isolatedGate = () =>
  makePsdGateLayer(
    new GateLogic({ ratePerSecond: 1e9 }),
    new IncidentTracker(),
  );

/** The real gate with only `reportOutcome` swapped for a spy — proves a call
 * was (or, critically, was NOT) made, which "incidentOpen ended up false"
 * can't distinguish from "never reported". Wrapping `isolatedGate` keeps
 * single-flight behaviour honest and survives `PsdGate` gaining methods. */
function spyGate() {
  const reportOutcome = vi.fn(() => Effect.succeed({ incidentOpen: false }));
  const layer = Layer.effect(
    PsdGateService,
    Effect.map(PsdGateService, (real) => ({ ...real, reportOutcome })),
  ).pipe(Layer.provide(isolatedGate()));
  return { layer, reportOutcome };
}

const dayMs = 24 * 60 * 60 * 1000;

/** Plant the `stale-since:{key}` marker as if the first unfixed stale read
 * happened `ageMs` ago (#3566) — drift is measured from it, not the soft TTL. */
function seedStaleSince(mockKv: ReturnType<typeof makeMockKv>, ageMs: number) {
  mockKv.store.set("stale-since:test-key", String(Date.now() - ageMs));
}

/** Collect every log entry emitted while the returned layer is provided. */
function captureLogs() {
  const entries: { level: string; message: string }[] = [];
  const layer = Logger.replace(
    Logger.defaultLogger,
    Logger.make(({ logLevel, message }) => {
      entries.push({ level: logLevel.label, message: String(message) });
    }),
  );
  return { entries, layer };
}

describe("TTL constants", () => {
  it("NEXT_MATCHES is 4 hours", () => {
    expect(TTL.NEXT_MATCHES).toBe(60 * 60 * 4);
  });

  it("MATCHES_TEAM is 24 hours", () => {
    expect(TTL.MATCHES_TEAM).toBe(60 * 60 * 24);
  });

  it("RANKING is 24 hours", () => {
    expect(TTL.RANKING).toBe(60 * 60 * 24);
  });

  it("match-detail proximity tiers: match TTLs floored at 15 min (#2328)", () => {
    // SWR serves stale instantly, so the soft TTL only sets refresh cadence —
    // every PSD-backed tier is ≥15 min. (No live scores → old 60 s tier moot.)
    expect(TTL.MATCH_DETAIL_LIVE).toBe(60 * 15);
    expect(TTL.MATCH_DETAIL_MATCHDAY).toBe(60 * 15);
    expect(TTL.MATCH_DETAIL_WEEK).toBe(60 * 60);
  });

  it("every match soft TTL is ≥15 min (#2328)", () => {
    const MIN = 15 * 60;
    for (const ttl of [
      TTL.MATCHES_TEAM,
      TTL.NEXT_MATCHES,
      TTL.MATCHES_WINDOW,
      TTL.MATCH_DETAIL_LIVE,
      TTL.MATCH_DETAIL_MATCHDAY,
      TTL.MATCH_DETAIL_WEEK,
      TTL.MATCH_DETAIL_DEFAULT,
      TTL.MATCH_DETAIL_PAST,
    ]) {
      expect(ttl).toBeGreaterThanOrEqual(MIN);
    }
  });

  it("MATCH_DETAIL_DEFAULT is 24 hours (distant)", () => {
    expect(TTL.MATCH_DETAIL_DEFAULT).toBe(60 * 60 * 24);
  });

  it("MATCH_DETAIL_PAST is 7 days (unchanged)", () => {
    expect(TTL.MATCH_DETAIL_PAST).toBe(60 * 60 * 24 * 7);
  });

  it("HARD_TTL_DEFAULT is 7 days", () => {
    expect(HARD_TTL_DEFAULT).toBe(60 * 60 * 24 * 7);
  });

  it("BG_REFRESH_TIMEOUT_MS stays under the gate's flight lease (#2335)", () => {
    // Outrunning the lease is worse than outrunning the waitUntil budget: at
    // t=leaseMs the next reader reclaims leadership and forks a SECOND full
    // fan-out, and the original's endFlight then releases the new leader's
    // flight. GateLogic's leaseMs default is 15 s (psd/gate-logic.ts); keep
    // headroom for the failure-path KV write.
    expect(BG_REFRESH_TIMEOUT_MS).toBeLessThan(15_000);
  });

  it("MISS_FETCH_TIMEOUT_MS stays under the gate's flight lease (#3467)", () => {
    // The miss-path leader holds the same 15 s lease. A fan-out that outruns it
    // lets a second reader reclaim leadership and fork a duplicate fan-out.
    expect(MISS_FETCH_TIMEOUT_MS).toBeLessThan(15_000);
  });
});

describe("TypedKvCache", () => {
  it("fresh path: cached value within softTtl returns without fetch", async () => {
    const mockKv = makeMockKv();
    // Cached 10 seconds ago, softTtl is 60 seconds → fresh
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "cached", value: 99 }, 10_000),
    );

    const fetchEffect = Effect.fail(
      new Error("fetch should not be called") as never,
    );

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "cached", value: 99 });
  });

  it("cache miss: calls fetch, stores wrapper with hardTtl, returns value", async () => {
    const mockKv = makeMockKv();
    let fetchCalled = false;
    const fetchEffect = Effect.sync(() => {
      fetchCalled = true;
      return { name: "test", value: 42 };
    });

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "test", value: 42 });
    expect(fetchCalled).toBe(true);
    // Stored with hardTtl (default 7 days), not softTtl
    expect(mockKv.put).toHaveBeenCalledWith(
      "test-key",
      expect.stringContaining('"value":{"name":"test","value":42}'),
      { expirationTtl: HARD_TTL_DEFAULT },
    );
    // Verify wrapper contains fetchedAt
    const stored = JSON.parse(mockKv.put.mock.calls[0]![1]);
    expect(stored).toHaveProperty("fetchedAt");
    expect(stored.value).toEqual({ name: "test", value: 42 });
  });

  it("stale + successful refresh: serves stale, updates cache with fresh value", async () => {
    const mockKv = makeMockKv();
    // Cached 2 hours ago, softTtl is 60 seconds → stale
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "old", value: 1 }, 2 * 60 * 60 * 1000),
    );

    const fetchEffect = Effect.succeed({ name: "fresh", value: 42 });

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    // No runner wired: the single-flight refresh runs inline, the caller still
    // gets the stale value (#3467).
    expect(result).toEqual({ name: "old", value: 1 });
    // Cache should be updated with new wrapper
    expect(JSON.parse(mockKv.store.get("test-key")!).value).toEqual({
      name: "fresh",
      value: 42,
    });
  });

  it("stale-on-error: fetch fails, returns stale value", async () => {
    const mockKv = makeMockKv();
    // Cached 2 hours ago, softTtl is 60 seconds → stale
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 99 }, 2 * 60 * 60 * 1000),
    );

    const fetchEffect = Effect.fail(new Error("PSD 429") as never);

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "stale", value: 99 });
    // The data key must NOT be overwritten on error; only the negative marker
    // is written (suppresses re-storming for NEG_MARKER_TTL).
    expect(mockKv.put).not.toHaveBeenCalledWith(
      "test-key",
      expect.anything(),
      expect.anything(),
    );
    expect(mockKv.put).toHaveBeenCalledWith("neg:test-key", "1", {
      expirationTtl: 120,
    });
  });

  it("cache hit with corrupted JSON: logs warning, falls through to fetch", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", "not-valid-json{{{");

    let fetchCalled = false;
    const fetchEffect = Effect.sync(() => {
      fetchCalled = true;
      return { name: "fallback", value: 1 };
    });

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "fallback", value: 1 });
    expect(fetchCalled).toBe(true);
  });

  it("cache hit with old format (no wrapper): serves it as stale and rewrites it via refresh", async () => {
    const mockKv = makeMockKv();
    // Pre-Phase 3 format: raw value without wrapper
    mockKv.store.set(
      "test-key",
      JSON.stringify({ name: "old-format", value: 5 }),
    );

    let fetchCalled = false;
    const fetchEffect = Effect.sync(() => {
      fetchCalled = true;
      return { name: "fresh", value: 42 };
    });

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "old-format", value: 5 });
    expect(fetchCalled).toBe(true);

    // Verify old-format entry was rewritten to new wrapper shape
    const stored = JSON.parse(mockKv.store.get("test-key")!);
    expect(stored).toHaveProperty("fetchedAt");
    expect(stored.value).toEqual({ name: "fresh", value: 42 });
  });

  it("supports dynamic softTtl function based on the fetched value", async () => {
    const mockKv = makeMockKv();
    const fetchEffect = Effect.succeed({ name: "test", value: 10 });

    const typedCache = TypedKvCache(TestSchema);
    await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, (v) => v.value * 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    // Stored with hardTtl (default 7 days)
    expect(mockKv.put).toHaveBeenCalledWith(
      "test-key",
      expect.stringContaining('"value":{"name":"test","value":10}'),
      { expirationTtl: HARD_TTL_DEFAULT },
    );
  });

  it("uses custom hardTtl when provided", async () => {
    const mockKv = makeMockKv();
    const fetchEffect = Effect.succeed({ name: "test", value: 10 });
    const customHardTtl = 60 * 60 * 24 * 30; // 30 days

    const typedCache = TypedKvCache(TestSchema);
    await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60, customHardTtl)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(mockKv.put).toHaveBeenCalledWith("test-key", expect.any(String), {
      expirationTtl: customHardTtl,
    });
  });

  it("CACHE_LONG_TTL overrides hardTtl to 365 days on cache miss", async () => {
    const mockKv = makeMockKv();
    const fetchEffect = Effect.succeed({ name: "test", value: 42 });

    const typedCache = TypedKvCache(TestSchema);
    await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv, { CACHE_LONG_TTL: "true" })),
        ),
    );

    expect(mockKv.put).toHaveBeenCalledWith("test-key", expect.any(String), {
      expirationTtl: HARD_TTL_LONG,
    });
  });

  it("CACHE_LONG_TTL 'false' does not override hardTtl", async () => {
    const mockKv = makeMockKv();
    const fetchEffect = Effect.succeed({ name: "test", value: 42 });

    const typedCache = TypedKvCache(TestSchema);
    await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv, { CACHE_LONG_TTL: "false" })),
        ),
    );

    expect(mockKv.put).toHaveBeenCalledWith("test-key", expect.any(String), {
      expirationTtl: HARD_TTL_DEFAULT,
    });
  });

  it("stale-on-error: a non-outage failure keeps stale and marks, never failing the read", async () => {
    const mockKv = makeMockKv();
    // Cached 2 hours ago, softTtl is 60 seconds → stale
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 99 }, 2 * 60 * 60 * 1000),
    );

    const notFoundError = {
      _tag: "ResourceNotFound" as const,
      message: "gone",
    };
    const fetchEffect = Effect.fail(notFoundError);

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60, undefined, {
          shouldServeStale: (err) =>
            (err as { _tag: string })._tag !== "ResourceNotFound",
        })
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "stale", value: 99 });
    expect(mockKv.store.get("neg:test-key")).toBe("1");
  });

  it("stale-on-error: serves stale when shouldServeStale returns true", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 99 }, 2 * 60 * 60 * 1000),
    );

    const unavailableError = {
      _tag: "UpstreamUnavailable" as const,
      message: "PSD 429",
    };
    const fetchEffect = Effect.fail(unavailableError);

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60, undefined, {
          shouldServeStale: (err) =>
            (err as { _tag: string })._tag !== "ResourceNotFound",
        })
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "stale", value: 99 });
  });

  it("cache miss: dies when fetch returns schema-invalid data", async () => {
    const mockKv = makeMockKv();
    // Fetch returns data that doesn't match TestSchema (value should be number, not string)
    const fetchEffect = Effect.succeed({
      name: "test",
      value: "not-a-number",
    } as never);

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromiseExit(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result._tag).toBe("Failure");
    // Should NOT cache invalid data
    expect(mockKv.put).not.toHaveBeenCalled();
  });

  it("stale + refresh: schema-invalid refresh data is never cached; stale is kept", async () => {
    const mockKv = makeMockKv();
    // Cached 2 hours ago → stale
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "old", value: 1 }, 2 * 60 * 60 * 1000),
    );

    // Refresh returns schema-invalid data
    const fetchEffect = Effect.succeed({ name: 123, value: "bad" } as never);

    const typedCache = TypedKvCache(TestSchema);
    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "old", value: 1 });
    // Should NOT cache invalid data
    expect(JSON.parse(mockKv.store.get("test-key")!).value).toEqual({
      name: "old",
      value: 1,
    });
  });
});

describe("TypedKvCache — stale-while-revalidate + storm gate (#2328)", () => {
  const staleWrapper = (value: unknown) =>
    makeWrapper(value, 2 * 60 * 60 * 1000);

  it("serves stale INSTANTLY, then background-refreshes the cache", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "old", value: 1 }));
    const gate = PsdGateTest;
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    const fetchEffect = Effect.succeed({ name: "fresh", value: 42 });
    const typedCache = TypedKvCache(TestSchema);

    const result = await Effect.runPromise(
      typedCache
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    // Foreground result is the STALE value (served without waiting).
    expect(result).toEqual({ name: "old", value: 1 });

    // Background refresh then overwrites KV with the fresh value.
    await settle();
    const stored = JSON.parse(mockKv.store.get("test-key")!);
    expect(stored.value).toEqual({ name: "fresh", value: 42 });
  });

  it("refreshInline: a stale value it flags is refreshed in the foreground and the fresh one served", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "old", value: 1 }));
    const gate = PsdGateTest;
    const { runnerLayer, settle } = withRunner(mockKv, gate);
    const run = (fetchEffect: Effect.Effect<{ name: string; value: number }>) =>
      Effect.runPromise(
        TypedKvCache(TestSchema)
          .getOrFetch("test-key", fetchEffect, 60, undefined, {
            refreshInline: (v) => v.name === "old",
          })
          .pipe(
            Effect.provide(runnerLayer),
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );

    expect(await run(Effect.succeed({ name: "fresh", value: 42 }))).toEqual({
      name: "fresh",
      value: 42,
    });
    await settle();
    expect(JSON.parse(mockKv.store.get("test-key")!).value).toEqual({
      name: "fresh",
      value: 42,
    });
  });

  it("refreshInline: a failed inline refresh still serves the stale value", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "old", value: 1 }));
    const gate = PsdGateTest;
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch(
          "test-key",
          Effect.fail(new Error("PSD 429") as never),
          60,
          undefined,
          { refreshInline: () => true },
        )
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    expect(result).toEqual({ name: "old", value: 1 });
    expect(mockKv.store.get("neg:test-key")).toBe("1");
  });

  it("refreshInline: a negative marker still wins, no inline fetch", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "old", value: 1 }));
    mockKv.store.set("neg:test-key", "1");
    const gate = PsdGateTest;
    const { runnerLayer, settle } = withRunner(mockKv, gate);
    let fetchCalled = false;

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch(
          "test-key",
          Effect.sync(() => {
            fetchCalled = true;
            return { name: "fresh", value: 2 };
          }),
          60,
          undefined,
          { refreshInline: () => true },
        )
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    expect(result).toEqual({ name: "old", value: 1 });
    expect(fetchCalled).toBe(false);
  });

  it("negative marker present → serves stale WITHOUT fetching", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "stale", value: 7 }));
    mockKv.store.set("neg:test-key", "1");
    const gate = PsdGateTest;
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    let fetchCalled = false;
    const fetchEffect = Effect.sync(() => {
      fetchCalled = true;
      return { name: "fresh", value: 99 };
    });

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    expect(result).toEqual({ name: "stale", value: 7 });
    expect(fetchCalled).toBe(false);
  });

  it("background refresh failure keeps stale and sets the negative marker", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "stale", value: 5 }));
    const gate = PsdGateTest;
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    const fetchEffect = Effect.fail(new Error("PSD 429") as never);

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    expect(result).toEqual({ name: "stale", value: 5 });
    // Data key unchanged; negative marker set.
    expect(JSON.parse(mockKv.store.get("test-key")!).value).toEqual({
      name: "stale",
      value: 5,
    });
    expect(mockKv.store.get("neg:test-key")).toBe("1");
  });

  it("no background runner: 50 concurrent stale reads run ONE refresh and all serve stale (#3467)", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "old", value: 1 }));
    const gate = makePsdGateLayer(new GateLogic({ ratePerSecond: 1e9 }));

    let fanOuts = 0;
    const fetchEffect = Effect.gen(function* () {
      fanOuts++;
      yield* Effect.sleep("20 millis");
      return { name: "fresh", value: 2 };
    });

    const run = () =>
      Effect.runPromise(
        TypedKvCache(TestSchema)
          .getOrFetch("test-key", fetchEffect, 60)
          .pipe(
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );

    const results = await Promise.all(Array.from({ length: 50 }, run));

    for (const r of results) expect(r).toEqual({ name: "old", value: 1 });
    expect(fanOuts).toBe(1);
    expect(JSON.parse(mockKv.store.get("test-key")!).value).toEqual({
      name: "fresh",
      value: 2,
    });
  });

  it("N concurrent misses collapse to ONE fan-out (single-flight)", async () => {
    const mockKv = makeMockKv();
    // Fresh shared gate so single-flight state is isolated to this test.
    const gate = makePsdGateLayer(new GateLogic({ ratePerSecond: 1e9 }));

    let fanOuts = 0;
    const fetchEffect = Effect.gen(function* () {
      fanOuts++;
      // Yield so all concurrent callers pass the miss check before the leader
      // finishes and writes KV.
      yield* Effect.sleep("5 millis");
      return { name: "fetched", value: 1 };
    });

    const typedCache = TypedKvCache(TestSchema);
    const run = () =>
      Effect.runPromise(
        typedCache
          .getOrFetch("test-key", fetchEffect, 60)
          .pipe(
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );

    const results = await Promise.all(Array.from({ length: 20 }, run));

    // All callers get the value; only the leader fanned out.
    for (const r of results) expect(r).toEqual({ name: "fetched", value: 1 });
    expect(fanOuts).toBe(1);
  });

  it("concurrent misses never run duplicate fan-outs, even when the leader fails", async () => {
    // AC3 under failure: followers re-enter single-flight instead of all
    // self-fetching, so at no instant do two fan-outs run for the same key.
    const mockKv = makeMockKv();
    const gate = makePsdGateLayer(new GateLogic({ ratePerSecond: 1e9 }));

    let inFlight = 0;
    let maxInFlight = 0;
    const fetchEffect = Effect.gen(function* () {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      yield* Effect.sleep("3 millis");
      inFlight--;
      return yield* Effect.fail(new Error("PSD 429") as never);
    });

    const typedCache = TypedKvCache(TestSchema);
    const run = () =>
      Effect.runPromiseExit(
        typedCache
          .getOrFetch("test-key", fetchEffect, 60)
          .pipe(
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );

    const exits = await Promise.all(Array.from({ length: 10 }, run));
    // Nothing was ever cached, so every caller surfaces the error (AC7).
    for (const e of exits) expect(e._tag).toBe("Failure");
    // Crucially: fan-outs were serialized, never concurrent.
    expect(maxInFlight).toBe(1);
  });

  it("sustained outage decouples PSD calls from request volume", async () => {
    // The storm collapse (#2324) is this decoupling: today every soft-lapsed read
    // re-fires the fan-out (the 475%-of-budget storm), whereas the negative
    // marker makes PSD load track the marker cadence, not the request rate —
    // after the first failed refresh, every subsequent read serves stale WITHOUT
    // fetching until the marker expires. Here 50 reads during an outage trigger a
    // SINGLE fan-out attempt; over a day the fan-out count is bounded by
    // day/NEG_MARKER_TTL windows rather than by traffic, which is what lands the
    // steady-state figure in the low-single-digit % the prototype measured (~4%).
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "stale", value: 1 }));
    const gate = PsdGateTest;

    let fetches = 0;
    const fetchEffect = Effect.gen(function* () {
      fetches++;
      return yield* Effect.fail(new Error("PSD 429") as never);
    });
    const typedCache = TypedKvCache(TestSchema);

    for (let i = 0; i < 50; i++) {
      const { runnerLayer, settle } = withRunner(mockKv, gate);
      const result = await Effect.runPromise(
        typedCache
          .getOrFetch("test-key", fetchEffect, 60)
          .pipe(
            Effect.provide(runnerLayer),
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );
      await settle();
      expect(result).toEqual({ name: "stale", value: 1 }); // always served
    }

    // 50 requests, but the marker capped PSD calls at the first attempt.
    expect(fetches).toBe(1);
  });

  it("self-heals: once PSD recovers, the marker clears and fresh data is served", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "stale", value: 1 }));
    mockKv.store.set("neg:test-key", "1"); // outage marker in place
    const gate = PsdGateTest;

    // Marker present → serve stale, no fetch. Then expire the marker.
    const typedCache = TypedKvCache(TestSchema);
    const runOnce = async (
      fetchEffect: Effect.Effect<{ name: string; value: number }>,
    ) => {
      const { runnerLayer, settle } = withRunner(mockKv, gate);
      const r = await Effect.runPromise(
        typedCache
          .getOrFetch("test-key", fetchEffect, 60)
          .pipe(
            Effect.provide(runnerLayer),
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );
      await settle();
      return r;
    };

    // While marked: stale, no refresh.
    expect(await runOnce(Effect.succeed({ name: "fresh", value: 2 }))).toEqual({
      name: "stale",
      value: 1,
    });

    // Simulate marker expiry.
    mockKv.store.delete("neg:test-key");

    // Recovery: serve stale now, background refresh succeeds → KV fresh + marker clear.
    await runOnce(Effect.succeed({ name: "fresh", value: 2 }));
    expect(JSON.parse(mockKv.store.get("test-key")!).value).toEqual({
      name: "fresh",
      value: 2,
    });
    expect(mockKv.store.get("neg:test-key")).toBeUndefined();
  });
});

describe("TypedKvCache — PSD incident alerting (#2329)", () => {
  it("escalates the serve-stale log WARN→ERROR while an incident is open", async () => {
    const mockKv = makeMockKv();
    // 2 h stale (< 24 h drift threshold) — the escalation here is driven purely
    // by the OPEN incident, not by drift.
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 2 * 60 * 60 * 1000),
    );
    const gate = isolatedGate(); // first failure opens the incident

    const { entries, layer: capture } = captureLogs();

    // No runner → blocking refresh path (synchronous, easy to assert).
    const fetchEffect = Effect.fail(new Error("PSD 429") as never);
    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(capture),
          Effect.provide(Logger.minimumLogLevel(LogLevel.All)),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "stale", value: 1 });
    expect(
      entries.some(
        (e) => e.level === "ERROR" && e.message.includes("refresh failed"),
      ),
    ).toBe(true);
    // Under the 24 h threshold → no slow-drift nudge.
    expect(mockKv.store.get("nudge:test-key")).toBeUndefined();
  });

  it("slow-drift nudge: >24h stale on a failed refresh sets the once/day marker", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs), // 3 days stale
    );
    seedStaleSince(mockKv, 2 * dayMs);
    const fetchEffect = Effect.fail(new Error("PSD 429") as never);
    const { entries, layer: capture } = captureLogs();

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(capture),
          Effect.provide(Logger.minimumLogLevel(LogLevel.All)),
          Effect.provide(KvCacheLive),
          Effect.provide(isolatedGate()),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "stale", value: 1 });
    expect(mockKv.store.get("nudge:test-key")).toBe("1");
    // #2335: the read-path drift check also claims that marker, so assert
    // `keepStale`'s own escalated line too — otherwise this no longer proves
    // anything about the failed-refresh path.
    expect(
      entries.some(
        (e) => e.level === "ERROR" && e.message.includes("refresh failed"),
      ),
    ).toBe(true);
  });

  it("slow-drift nudge is deduped once/day/key (marker already present)", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    seedStaleSince(mockKv, 2 * dayMs);
    mockKv.store.set("nudge:test-key", "1"); // already pinged today
    const fetchEffect = Effect.fail(new Error("PSD 429") as never);

    await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(isolatedGate()),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    // Marker pre-existed → we must NOT re-write (re-ping) it.
    expect(mockKv.put).not.toHaveBeenCalledWith(
      "nudge:test-key",
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("TypedKvCache — non-PSD-backed caches never speak for PSD incident state (#2868)", () => {
  const staleWrapper = (value: unknown) =>
    makeWrapper(value, 2 * 60 * 60 * 1000);

  it("a psdBacked: false cache's background refresh SUCCESS never reaches gate.reportOutcome", async () => {
    const mockKv = makeMockKv();
    // Deliberately NOT "related:"-prefixed — the classification is a
    // property of the cache instance (the `psdBacked` option below), not a
    // guess from the key string (#2868 review).
    mockKv.store.set("vec:1:max", staleWrapper({ name: "old", value: 1 }));
    const { layer: gate, reportOutcome } = spyGate();
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    const fetchEffect = Effect.succeed({ name: "fresh", value: 2 });

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema, { psdBacked: false })
        .getOrFetch("vec:1:max", fetchEffect, 60)
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    // Foreground stale serve is unaffected by the guard...
    expect(result).toEqual({ name: "old", value: 1 });
    // ...and the background refresh really did succeed (proves the guard
    // suppresses only the REPORT, not the refresh itself)...
    expect(JSON.parse(mockKv.store.get("vec:1:max")!).value).toEqual({
      name: "fresh",
      value: 2,
    });
    // ...but it must never be able to close a real PSD outage on the
    // strength of a Vectorize-only success (#2868 review).
    expect(reportOutcome).not.toHaveBeenCalled();
  });

  it("a psdBacked: false cache's background refresh FAILURE never reaches gate.reportOutcome", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("vec:1:max", staleWrapper({ name: "old", value: 1 }));
    const { layer: gate, reportOutcome } = spyGate();
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    const fetchEffect = Effect.fail(new Error("vectorize down") as never);

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema, { psdBacked: false })
        .getOrFetch("vec:1:max", fetchEffect, 60)
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    expect(result).toEqual({ name: "old", value: 1 });
    // Normal failure path still ran (negative marker set)...
    expect(mockKv.store.get("neg:vec:1:max")).toBe("1");
    // ...but it must never be able to open a false PSD outage on the
    // strength of a Vectorize-only failure (#2868 review).
    expect(reportOutcome).not.toHaveBeenCalled();
  });

  it("control: a default (psdBacked-omitted) cache's background refresh success STILL reports to the gate", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", staleWrapper({ name: "old", value: 1 }));
    const { layer: gate, reportOutcome } = spyGate();
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    const fetchEffect = Effect.succeed({ name: "fresh", value: 2 });

    await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    // The guard is scoped to caches declared psdBacked: false, not a
    // blanket disable — a normal (default) cache must keep reporting.
    expect(reportOutcome).toHaveBeenCalledWith({ ok: true, key: "test-key" });
  });

  it.each([
    ["SUCCESS", Effect.succeed({ name: "fresh", value: 2 })],
    ["FAILURE", Effect.fail(new Error("vectorize down") as never)],
  ])(
    "a psdBacked: false cache's cold-miss %s never reaches gate.reportOutcome",
    async (_label, fetchEffect) => {
      const mockKv = makeMockKv();
      const { layer: gate, reportOutcome } = spyGate();

      await Effect.runPromise(
        TypedKvCache(TestSchema, { psdBacked: false })
          .getOrFetch("vec:1:max", fetchEffect, 60)
          .pipe(
            Effect.either,
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );

      expect(reportOutcome).not.toHaveBeenCalled();
    },
  );
});

describe("Scheduled-job failure signal stays decoupled from PSD incident state (#2870)", () => {
  it("running many job failures through reportScheduledJobOutcome never touches IncidentTracker, so the read path's own escalation is unaffected", async () => {
    const mockKv = makeMockKv();
    const incident = new IncidentTracker();
    const reportSpy = vi.spyOn(incident, "report");
    const gateLayer = makePsdGateLayer(
      new GateLogic({ ratePerSecond: 1e9 }),
      incident,
    );

    // Seven consecutive nightly job failures — the exact regression Option A
    // was rejected to avoid is `gate.reportOutcome` (and therefore
    // IncidentTracker) getting fed by the scheduled path.
    for (let i = 0; i < 7; i++) {
      await Effect.runPromise(
        reportScheduledJobOutcome("psd-sanity-sync", {
          ok: false,
          error: new Error("PSD 429"),
        }).pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
      );
    }

    // The job-alert reporter's Effect signature requires only KvCacheService
    // and WorkerEnvTag — it was never given a PsdGateService to call.
    expect(reportSpy).not.toHaveBeenCalled();
    expect(incident.isOpen).toBe(false);

    // Confirm the tracker is in its pristine "healthy since forever" state,
    // not merely coincidentally closed: an UNRELATED read-path key's own
    // first failure still opens an incident exactly as it would have with no
    // job failures at all, proving the seven failures above left no trace.
    mockKv.store.set(
      "matches:team:1",
      makeWrapper({ name: "stale", value: 1 }, 2 * 60 * 60 * 1000),
    );
    const { entries, layer: capture } = captureLogs();

    await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch(
          "matches:team:1",
          Effect.fail(new Error("PSD 429") as never),
          60,
        )
        .pipe(
          Effect.provide(capture),
          Effect.provide(Logger.minimumLogLevel(LogLevel.All)),
          Effect.provide(KvCacheLive),
          Effect.provide(gateLayer),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(
      entries.some(
        (e) => e.level === "ERROR" && e.message.includes("refresh failed"),
      ),
    ).toBe(true);
    expect(incident.isOpen).toBe(true); // opened NOW, for the first time, by this read failure alone
  });
});

describe("TypedKvCache — silent-drift observability (#2335)", () => {
  /** A fetch that never settles — stands in for the slow fan-out that Cloudflare
   * would kill ~30 s after the invocation ends. */
  const hangingFetch = Effect.never as Effect.Effect<{
    name: string;
    value: number;
  }>;

  const nudgePuts = (mockKv: ReturnType<typeof makeMockKv>) =>
    mockKv.put.mock.calls.filter(([k]) => k === "nudge:test-key");

  it("a timed-out background refresh marks stale and does NOT open an incident", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 2 * 60 * 60 * 1000),
    );
    const { layer: gate, reportOutcome } = spyGate();
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", hangingFetch, 60, HARD_TTL_DEFAULT, {
          backgroundTimeoutMs: 20,
        })
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    expect(result).toEqual({ name: "stale", value: 1 });
    // Normal failure path ran: marker set, so we stop re-forking a doomed refresh.
    expect(mockKv.store.get("neg:test-key")).toBe("1");
    // A slow fan-out is not proof PSD is down — no spurious outage ping.
    expect(reportOutcome).not.toHaveBeenCalled();
  });

  it("a timed-out refresh on a drifting key escalates its own log to ERROR", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    seedStaleSince(mockKv, 2 * dayMs);
    const { layer: gate, reportOutcome } = spyGate();
    const { entries, layer: capture } = captureLogs();
    const { runnerLayer, settle } = withRunner(
      mockKv,
      gate,
      Layer.merge(capture, Logger.minimumLogLevel(LogLevel.All)),
    );

    await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", hangingFetch, 60, HARD_TTL_DEFAULT, {
          backgroundTimeoutMs: 20,
        })
        .pipe(
          Effect.provide(capture),
          Effect.provide(Logger.minimumLogLevel(LogLevel.All)),
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    // `keepStale`'s OWN line — the read-path check emits a different message, so
    // this pins the timeout path's escalation rather than being satisfied by it.
    expect(
      entries.some(
        (e) =>
          e.level === "ERROR" && e.message.includes("timed out after 20ms"),
      ),
    ).toBe(true);
    // Escalation is a log decision, not an incident: still no outage reported.
    expect(reportOutcome).not.toHaveBeenCalled();
  });

  it("read path nudges a drifting value even when no refresh ever failed", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    seedStaleSince(mockKv, 2 * dayMs);
    const { runnerLayer, settle } = withRunner(mockKv, PsdGateTest);
    const { entries, layer: capture } = captureLogs();

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch(
          "test-key",
          Effect.succeed({ name: "fresh", value: 42 }),
          60,
        )
        .pipe(
          Effect.provide(capture),
          Effect.provide(Logger.minimumLogLevel(LogLevel.All)),
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    expect(result).toEqual({ name: "stale", value: 1 });
    expect(mockKv.store.get("nudge:test-key")).toBe("1");
    expect(
      entries.some(
        (e) => e.level === "ERROR" && e.message.includes("have not landed"),
      ),
    ).toBe(true);
  });

  it("a drifting key read twice nudges only once (once/day dedup holds)", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    seedStaleSince(mockKv, 2 * dayMs);
    const { layer: gate } = spyGate();
    const { runnerLayer, settle } = withRunner(mockKv, gate);

    const read = () =>
      Effect.runPromise(
        TypedKvCache(TestSchema)
          .getOrFetch("test-key", hangingFetch, 60, HARD_TTL_DEFAULT, {
            backgroundTimeoutMs: 20,
          })
          .pipe(
            Effect.provide(runnerLayer),
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );

    await read();
    await settle();
    await read();
    await settle();

    expect(nudgePuts(mockKv)).toHaveLength(1);
  });

  it("a healthy 24h-softTtl key stale by a minute does not nudge or escalate", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, dayMs + 60_000),
    );
    const { runnerLayer, settle } = withRunner(mockKv, PsdGateTest);
    const { entries, layer: capture } = captureLogs();

    // Schema-invalid refresh: the one keepStale path where drift alone decides
    // escalation (no incident is opened), so it isolates the rule under test.
    // Absolute age here is >24 h — the old rule would nudge; the soft-TTL-relative
    // one sees a single minute of drift.
    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch(
          "test-key",
          Effect.succeed({ name: "bad" } as never),
          TTL.MATCHES_TEAM,
        )
        .pipe(
          Effect.provide(capture),
          Effect.provide(Logger.minimumLogLevel(LogLevel.All)),
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );
    await settle();

    expect(result).toEqual({ name: "stale", value: 1 });
    expect(mockKv.store.get("nudge:test-key")).toBeUndefined();
    expect(entries.some((e) => e.level === "ERROR")).toBe(false);
  });

  it("a drifting key with a negative marker present still nudges", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    seedStaleSince(mockKv, 2 * dayMs);
    mockKv.store.set("neg:test-key", "1");

    let fetchCalled = false;
    const fetchEffect = Effect.sync(() => {
      fetchCalled = true;
      return { name: "fresh", value: 9 };
    });

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetchEffect, 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "stale", value: 1 });
    expect(fetchCalled).toBe(false);
    // The marker short-circuits the refresh — the nudge must not depend on it.
    expect(mockKv.store.get("nudge:test-key")).toBe("1");
  });
});

describe("TypedKvCache — drift is measured from the first unfixed stale read (#3566)", () => {
  const hourMs = 60 * 60 * 1000;
  const nudgePuts = (mockKv: ReturnType<typeof makeMockKv>) =>
    mockKv.put.mock.calls.filter(([k]) => k === "nudge:test-key");

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Only `Date` is faked: Effect's timeouts keep their real timers. */
  const startClock = () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
  };

  /** A runner that drops the refresh fork — a `waitUntil` killed before it
   * reports anything — but still runs the drift ping. */
  function killedRefreshRunner(mockKv: ReturnType<typeof makeMockKv>) {
    const pending: Promise<void>[] = [];
    const layer = Layer.mergeAll(KvCacheLive, PsdGateTest).pipe(
      Layer.provideMerge(makeEnvLayer(mockKv)),
    );
    const runnerLayer = Layer.succeed(BackgroundRunnerService, {
      fork: (label, effect) =>
        Effect.sync(() => {
          if (label.startsWith("refresh:")) return;
          pending.push(
            Effect.runPromise(
              Effect.provide(effect, layer) as unknown as Effect.Effect<void>,
            ),
          );
        }),
    });
    return { runnerLayer, settle: () => Promise.all(pending) };
  }

  const read = (
    mockKv: ReturnType<typeof makeMockKv>,
    runnerLayer: Layer.Layer<BackgroundRunnerService>,
    fetch: Effect.Effect<{ name: string; value: number }>,
    gate: Layer.Layer<PsdGateService> = PsdGateTest,
  ) =>
    Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetch, 60)
        .pipe(
          Effect.provide(runnerLayer),
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

  it("a value read for the first time 3 days past its soft TTL, whose refresh lands, does not nudge", async () => {
    startClock();
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    const { runnerLayer, settle } = withRunner(mockKv, PsdGateTest);

    const result = await read(
      mockKv,
      runnerLayer,
      Effect.succeed({ name: "fresh", value: 2 }),
    );
    await settle();

    expect(result).toEqual({ name: "stale", value: 1 });
    // The read started the clock; the landed refresh stopped it again.
    expect(mockKv.put).toHaveBeenCalledWith(
      "stale-since:test-key",
      String(Date.now()),
      { expirationTtl: HARD_TTL_DEFAULT },
    );
    expect(mockKv.store.has("stale-since:test-key")).toBe(false);
    expect(mockKv.store.has("nudge:test-key")).toBe(false);
  });

  it("a cold fetch clears the stale-since marker too", async () => {
    startClock();
    const mockKv = makeMockKv();
    mockKv.store.set("stale-since:test-key", String(Date.now() - 2 * dayMs));
    const { runnerLayer } = withRunner(mockKv, PsdGateTest);

    await read(mockKv, runnerLayer, Effect.succeed({ name: "cold", value: 3 }));

    expect(mockKv.store.has("stale-since:test-key")).toBe(false);
  });

  it("a fresh read does no stale-since I/O", async () => {
    startClock();
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", makeWrapper({ name: "ok", value: 1 }, 1_000));
    const { runnerLayer } = withRunner(mockKv, PsdGateTest);

    await read(mockKv, runnerLayer, Effect.succeed({ name: "x", value: 2 }));

    expect(mockKv.get.mock.calls.map(([k]) => k)).toEqual(["test-key"]);
    expect(mockKv.put).not.toHaveBeenCalled();
  });

  it("a refresh that keeps failing nudges once, after 24 h of stale reads", async () => {
    startClock();
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    const { layer: gate } = spyGate();
    const { runnerLayer, settle } = withRunner(mockKv, gate);
    const failing = Effect.fail(new Error("PSD 429") as never);
    const readFailing = async () => {
      mockKv.store.delete("neg:test-key"); // the 2 min marker has lapsed
      await read(mockKv, runnerLayer, failing, gate);
      await settle();
    };

    await readFailing(); // first stale read: starts the clock
    expect(nudgePuts(mockKv)).toHaveLength(0);

    vi.setSystemTime(Date.now() + 23 * hourMs);
    await readFailing();
    expect(nudgePuts(mockKv)).toHaveLength(0);

    vi.setSystemTime(Date.now() + 2 * hourMs); // 25 h after the first stale read
    await readFailing();
    expect(nudgePuts(mockKv)).toHaveLength(1);

    await readFailing(); // same day: deduped
    expect(nudgePuts(mockKv)).toHaveLength(1);
  });

  it("a killed refresh (no outcome ever reported) nudges after 24 h", async () => {
    startClock();
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    const { runnerLayer, settle } = killedRefreshRunner(mockKv);
    const readKilled = async () => {
      await read(mockKv, runnerLayer, Effect.never);
      await settle();
    };

    await readKilled();
    expect(nudgePuts(mockKv)).toHaveLength(0);

    vi.setSystemTime(Date.now() + 25 * hourMs);
    await readKilled();
    expect(nudgePuts(mockKv)).toHaveLength(1);
  });

  it("treats a marker dated before the value's fetchedAt as absent and rewrites it", async () => {
    startClock();
    const mockKv = makeMockKv();
    // Left behind by an earlier spell whose delete failed; the value was
    // rewritten since, then sat idle for 3 days.
    mockKv.store.set("stale-since:test-key", String(Date.now() - 10 * dayMs));
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
    );
    const { runnerLayer, settle } = killedRefreshRunner(mockKv);

    await read(mockKv, runnerLayer, Effect.never);
    await settle();

    expect(nudgePuts(mockKv)).toHaveLength(0);
    expect(mockKv.store.get("stale-since:test-key")).toBe(String(Date.now()));
  });

  it("a related:* drift message says 'Cached data', a PSD-backed one 'PSD data'", async () => {
    startClock();
    const slack = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", slack);
    const run = async (psdBacked: boolean) => {
      const mockKv = makeMockKv();
      mockKv.store.set(
        "test-key",
        makeWrapper({ name: "stale", value: 1 }, 3 * dayMs),
      );
      seedStaleSince(mockKv, 26 * hourMs);
      const { runnerLayer, settle } = killedRefreshRunner(mockKv);
      await Effect.runPromise(
        TypedKvCache(TestSchema, { psdBacked })
          .getOrFetch("test-key", Effect.never, 60)
          .pipe(
            Effect.provide(runnerLayer),
            Effect.provide(KvCacheLive),
            Effect.provide(PsdGateTest),
            Effect.provide(
              makeEnvLayer(mockKv, {
                SLACK_ALERT_WEBHOOK_URL: "https://hooks.slack.test/x",
              }),
            ),
          ),
      );
      await settle();
    };
    const lastText = () => {
      const calls = slack.mock.calls as unknown as [string, RequestInit][];
      return JSON.parse(String(calls[calls.length - 1]?.[1].body)).text;
    };

    await run(false);
    expect(lastText()).toContain("Cached data drifting stale");
    expect(lastText()).toContain("not refreshed for 1d 2h of reads");

    await run(true);
    expect(lastText()).toContain("PSD data drifting stale");
  });
});

describe("KvCacheService", () => {
  it("returns null on a cache miss", async () => {
    const mockKv = makeMockKv();
    const program = Effect.gen(function* () {
      const cache = yield* KvCacheService;
      return yield* cache.get("missing-key");
    });
    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(KvCacheLive),
        Effect.provide(PsdGateTest),
        Effect.provide(makeEnvLayer(mockKv)),
      ),
    );
    expect(result).toBeNull();
  });

  it("stores and retrieves a value with correct TTL", async () => {
    const mockKv = makeMockKv();
    const program = Effect.gen(function* () {
      const cache = yield* KvCacheService;
      yield* cache.set("test-key", "hello", 60);
      return yield* cache.get("test-key");
    });
    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(KvCacheLive),
        Effect.provide(PsdGateTest),
        Effect.provide(makeEnvLayer(mockKv)),
      ),
    );
    expect(result).toBe("hello");
    expect(mockKv.put).toHaveBeenCalledWith("test-key", "hello", {
      expirationTtl: 60,
    });
  });
});

describe("makeDurableKv (#2873)", () => {
  it("setForever writes with NO expiry at all — not even a long one", async () => {
    const mockKv = makeMockKv();
    const durable = makeDurableKv(mockKv as unknown as KVNamespace);

    await Effect.runPromise(durable.setForever("sync:team-cursor", "3"));

    // Exactly 2 args — no `{ expirationTtl }` third argument. A TTL here
    // would silently restart the team rotation once it expired (the
    // original finding, #2873): `sync/psd-sanity-sync.ts`'s cursor write
    // must produce this call shape.
    expect(mockKv.put).toHaveBeenCalledWith("sync:team-cursor", "3");
    expect(mockKv.put.mock.calls[0]).toHaveLength(2);
  });

  it("set writes with the given TTL", async () => {
    const mockKv = makeMockKv();
    const durable = makeDurableKv(mockKv as unknown as KVNamespace);

    await Effect.runPromise(durable.set("some:key", "value", 3600));

    expect(mockKv.put).toHaveBeenCalledWith("some:key", "value", {
      expirationTtl: 3600,
    });
  });

  it("surfaces a KvError instead of swallowing a failed get", async () => {
    const mockKv = makeMockKv();
    mockKv.get = vi.fn(async () => {
      throw new Error("KV unavailable");
    });
    const durable = makeDurableKv(mockKv as unknown as KVNamespace);

    const result = await Effect.runPromise(
      durable.get("some:key").pipe(Effect.either),
    );

    expect(result._tag).toBe("Left");
    expect(
      (result as Extract<typeof result, { _tag: "Left" }>).left,
    ).toBeInstanceOf(KvError);
  });

  it("surfaces a KvError instead of swallowing a failed list — an empty page here must never look like a drained sync loop", async () => {
    const mockKv = makeMockKv();
    mockKv.list = vi.fn(async () => {
      throw new Error("KV unavailable");
    });
    const durable = makeDurableKv(mockKv as unknown as KVNamespace);

    const result = await Effect.runPromise(
      durable.list({ prefix: "x:" }).pipe(Effect.either),
    );

    expect(result._tag).toBe("Left");
    expect(
      (result as Extract<typeof result, { _tag: "Left" }>).left,
    ).toBeInstanceOf(KvError);
  });

  it("surfaces a KvError instead of swallowing a failed set/setForever/delete", async () => {
    const mockKv = makeMockKv();
    mockKv.put = vi.fn(async () => {
      throw new Error("KV unavailable");
    });
    mockKv.delete = vi.fn(async () => {
      throw new Error("KV unavailable");
    });
    const durable = makeDurableKv(mockKv as unknown as KVNamespace);

    const [setResult, foreverResult, deleteResult] = await Promise.all([
      Effect.runPromise(durable.set("k", "v", 60).pipe(Effect.either)),
      Effect.runPromise(durable.setForever("k", "v").pipe(Effect.either)),
      Effect.runPromise(durable.delete("k").pipe(Effect.either)),
    ]);

    expect(setResult._tag).toBe("Left");
    expect(foreverResult._tag).toBe("Left");
    expect(deleteResult._tag).toBe("Left");
  });

  it("list drains every page in order until list_complete", async () => {
    const mockKv = makeMockKv({ pageSize: 2 });
    mockKv.store.set("ns:a", "1");
    mockKv.store.set("ns:b", "1");
    mockKv.store.set("ns:c", "1");
    const durable = makeDurableKv(mockKv as unknown as KVNamespace);

    const page1 = await Effect.runPromise(durable.list({ prefix: "ns:" }));
    expect(page1.keys).toEqual(["ns:a", "ns:b"]);
    expect(page1.complete).toBe(false);
    expect(page1.cursor).toBeDefined();

    const page2 = await Effect.runPromise(
      durable.list({ prefix: "ns:", cursor: page1.cursor }),
    );
    expect(page2.keys).toEqual(["ns:c"]);
    expect(page2.complete).toBe(true);
    expect(page2.cursor).toBeUndefined();
  });

  it("forDataset returns a handle carrying `.dataset`, with the same operations", async () => {
    const mockKv = makeMockKv();
    const durable = makeDurableKv(mockKv as unknown as KVNamespace);

    const scoped = durable.forDataset("staging");
    expect(scoped.dataset).toBe("staging");

    // Same op, just called through the scoped handle — proves the caller
    // gets a real, usable DurableKv back, not a stub.
    await Effect.runPromise(
      scoped.setForever("search-index:manifest:staging", "[]"),
    );
    expect(mockKv.put).toHaveBeenCalledWith(
      "search-index:manifest:staging",
      "[]",
    );
  });
});

describe("TypedKvCache — not-found cache (#3468)", () => {
  const notFound = new ResourceNotFoundError({
    message: "HTTP 404: Not Found",
    resourceType: "psd-resource",
    resourceId: 999,
  });

  it("caches a cold-miss ResourceNotFound for 1 hour; the repeat makes no fetch", async () => {
    const mockKv = makeMockKv();
    const fetch = vi.fn(() => notFound);
    const fetchEffect = Effect.suspend(() => Effect.fail(fetch()));
    const run = () =>
      Effect.runPromise(
        TypedKvCache(TestSchema)
          .getOrFetch("test-key", fetchEffect, 60)
          .pipe(
            Effect.flip,
            Effect.provide(KvCacheLive),
            Effect.provide(PsdGateTest),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );

    const first = await run();
    const second = await run();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(first).toBe(notFound);
    expect(second).toBeInstanceOf(ResourceNotFoundError);
    expect(second).toMatchObject({
      message: notFound.message,
      resourceType: notFound.resourceType,
      resourceId: notFound.resourceId,
    });
    expect(mockKv.put).toHaveBeenCalledWith("test-key", expect.any(String), {
      expirationTtl: NOT_FOUND_TTL,
    });
    expect(NOT_FOUND_TTL).toBe(60 * 60);
  });

  it("keeps every other cold-miss error uncached", async () => {
    const mockKv = makeMockKv();
    const fetch = vi.fn(
      () => new UpstreamUnavailableError({ message: "HTTP 503", status: 503 }),
    );
    const fetchEffect = Effect.suspend(() => Effect.fail(fetch()));
    const run = () =>
      Effect.runPromise(
        TypedKvCache(TestSchema)
          .getOrFetch("test-key", fetchEffect, 60)
          .pipe(
            Effect.flip,
            Effect.provide(KvCacheLive),
            Effect.provide(PsdGateTest),
            Effect.provide(makeEnvLayer(mockKv)),
          ),
      );

    await run();
    await run();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mockKv.store.has("test-key")).toBe(false);
  });
});

describe("TypedKvCache — PSD on-demand daily budget (#3468)", () => {
  const budgetEnv = { PSD_ONDEMAND_DAILY_BUDGET: "100" };
  // The count lives in the PsdGate DO (#3490), not KV: seed a gate with `n`
  // calls already granted today.
  const gateWith = (n: number) => {
    const logic = new GateLogic({ ratePerSecond: 1e9 });
    logic.restoreCount({
      day: new Date().toISOString().slice(0, 10),
      count: n,
    });
    return makePsdGateLayer(logic);
  };

  it("a cold miss past the budget fails fast with UpstreamUnavailable and makes no fetch", async () => {
    const mockKv = makeMockKv();
    const gate = gateWith(100);
    const fetch = vi.fn(() => ({ name: "fresh", value: 1 }));

    const error = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", Effect.sync(fetch), 60)
        .pipe(
          Effect.flip,
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv, budgetEnv)),
        ),
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(error).toBeInstanceOf(UpstreamUnavailableError);
  });

  it("a granted acquireToken moves the count the budget sees", async () => {
    const logic = new GateLogic({ ratePerSecond: 1e9 });
    logic.restoreCount({
      day: new Date().toISOString().slice(0, 10),
      count: 99,
    });
    const gate = makePsdGateLayer(logic);
    const run = () =>
      Effect.runPromise(
        TypedKvCache(TestSchema)
          .getOrFetch(
            `k-${Math.random()}`,
            Effect.succeed({ name: "x", value: 1 }),
            60,
          )
          .pipe(
            Effect.either,
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(makeEnvLayer(makeMockKv(), budgetEnv)),
          ),
      );

    expect((await run())._tag).toBe("Right");
    await logic.acquireToken(); // one PSD call elsewhere takes the day to 100
    expect((await run())._tag).toBe("Left");
  });

  it("a cold miss under the budget still fetches", async () => {
    const mockKv = makeMockKv();
    const gate = gateWith(99);
    const fetch = vi.fn(() => ({ name: "fresh", value: 1 }));

    await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", Effect.sync(fetch), 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv, budgetEnv)),
        ),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("a stale key past the budget still serves stale, and its background refresh still runs", async () => {
    const mockKv = makeMockKv();
    const gate = gateWith(100);
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "old", value: 1 }, 2 * 60 * 60 * 1000),
    );
    const pending: Promise<void>[] = [];
    const layer = Layer.mergeAll(KvCacheLive, gate).pipe(
      Layer.provideMerge(makeEnvLayer(mockKv, budgetEnv)),
    );
    const runnerLayer = Layer.succeed(BackgroundRunnerService, {
      fork: (_label, effect) =>
        Effect.sync(() => {
          pending.push(
            Effect.runPromise(
              Effect.provide(effect, layer) as unknown as Effect.Effect<void>,
            ),
          );
        }),
    });
    const fetch = vi.fn(() => ({ name: "fresh", value: 2 }));

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", Effect.sync(fetch), 60)
        .pipe(Effect.provide(runnerLayer), Effect.provide(layer)),
    );
    await Promise.all(pending);

    expect(result).toEqual({ name: "old", value: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sends one Slack alert per UTC day when the budget is hit", async () => {
    const mockKv = makeMockKv();
    const gate = gateWith(100);
    const slack = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok"));
    const run = (key: string) =>
      Effect.runPromise(
        TypedKvCache(TestSchema)
          .getOrFetch(key, Effect.succeed({ name: "x", value: 1 }), 60)
          .pipe(
            Effect.flip,
            Effect.provide(KvCacheLive),
            Effect.provide(gate),
            Effect.provide(
              makeEnvLayer(mockKv, {
                ...budgetEnv,
                SLACK_ALERT_WEBHOOK_URL: "https://hooks.slack.test/x",
              }),
            ),
          ),
      );

    await run("key-a");
    await run("key-b");

    expect(slack).toHaveBeenCalledTimes(1);
    expect(slack.mock.calls[0]![0]).toBe("https://hooks.slack.test/x");
    slack.mockRestore();
  });

  it("a non-PSD cache (psdBacked: false) ignores the budget", async () => {
    const mockKv = makeMockKv();
    const gate = gateWith(100);
    const fetch = vi.fn(() => ({ name: "fresh", value: 1 }));

    await Effect.runPromise(
      TypedKvCache(TestSchema, { psdBacked: false })
        .getOrFetch("test-key", Effect.sync(fetch), 60)
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv, budgetEnv)),
        ),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("TypedKvCache — whole-fetch cap on the cold-miss leader (#3467)", () => {
  const hangingFetch = Effect.never as Effect.Effect<{
    name: string;
    value: number;
  }>;

  it("a cold-miss fetch that outruns the cap fails UpstreamUnavailable, releases the flight and reports nothing", async () => {
    const mockKv = makeMockKv();
    const logic = new GateLogic({ ratePerSecond: 1e9 });
    const { layer: gate, reportOutcome } = (() => {
      const reportOutcome = vi.fn(() =>
        Effect.succeed({ incidentOpen: false }),
      );
      const layer = Layer.effect(
        PsdGateService,
        Effect.map(PsdGateService, (real) => ({ ...real, reportOutcome })),
      ).pipe(Layer.provide(makePsdGateLayer(logic)));
      return { layer, reportOutcome };
    })();

    const result = await Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", hangingFetch, 60, HARD_TTL_DEFAULT, {
          fetchTimeoutMs: 20,
        })
        .pipe(
          Effect.either,
          Effect.provide(KvCacheLive),
          Effect.provide(gate),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(UpstreamUnavailableError);
    }
    // The flight ended with the failure, so the next reader can lead.
    expect(logic.isInFlight("test-key")).toBe(false);
    // A slow fan-out is not proof PSD is down.
    expect(reportOutcome).not.toHaveBeenCalled();
  });
});

describe("TypedKvCache — partial fan-out is cached briefly (#3489)", () => {
  const FRESH = { name: "fresh", value: 2 };
  const run = (
    mockKv: ReturnType<typeof makeMockKv>,
    fetch: Effect.Effect<{ name: string; value: number }>,
    isPartial: (v: { name: string; value: number }) => boolean,
  ) =>
    Effect.runPromise(
      TypedKvCache(TestSchema)
        .getOrFetch("test-key", fetch, TTL.NEXT_MATCHES, HARD_TTL_DEFAULT, {
          isPartial,
        })
        .pipe(
          Effect.provide(KvCacheLive),
          Effect.provide(PsdGateTest),
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

  it("PARTIAL_FANOUT is 5 minutes", () => {
    expect(TTL.PARTIAL_FANOUT).toBe(60 * 5);
  });

  it("stores a partial result flagged, and a complete one unflagged", async () => {
    const partialKv = makeMockKv();
    await run(partialKv, Effect.succeed(FRESH), () => true);
    expect(JSON.parse(partialKv.store.get("test-key")!).partial).toBe(true);

    const completeKv = makeMockKv();
    await run(completeKv, Effect.succeed(FRESH), () => false);
    expect(JSON.parse(completeKv.store.get("test-key")!)).not.toHaveProperty(
      "partial",
    );
  });

  it("a partial entry 10 min old is stale (refetched) though the soft TTL is 4 h", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      JSON.stringify({
        value: { name: "old", value: 1 },
        fetchedAt: Date.now() - 10 * 60_000,
        partial: true,
      }),
    );
    let fetched = 0;
    const result = await run(
      mockKv,
      Effect.sync(() => {
        fetched++;
        return FRESH;
      }),
      () => false,
    );
    // Stale-while-revalidate: the old value is served, a refresh ran.
    expect(result).toEqual({ name: "old", value: 1 });
    expect(fetched).toBe(1);
    expect(JSON.parse(mockKv.store.get("test-key")!).value).toEqual(FRESH);
  });

  it("a complete entry of the same age keeps its full TTL (no refetch)", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      makeWrapper({ name: "old", value: 1 }, 10 * 60_000),
    );
    let fetched = 0;
    await run(
      mockKv,
      Effect.sync(() => {
        fetched++;
        return FRESH;
      }),
      () => false,
    );
    expect(fetched).toBe(0);
  });

  it("a partial entry younger than 5 min is fresh", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set(
      "test-key",
      JSON.stringify({
        value: { name: "old", value: 1 },
        fetchedAt: Date.now() - 60_000,
        partial: true,
      }),
    );
    let fetched = 0;
    await run(
      mockKv,
      Effect.sync(() => {
        fetched++;
        return FRESH;
      }),
      () => false,
    );
    expect(fetched).toBe(0);
  });
});
