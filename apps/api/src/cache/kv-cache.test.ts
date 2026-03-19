import { describe, it, expect, vi } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import {
  KvCacheService,
  KvCacheLive,
  TypedKvCache,
  TTL,
  HARD_TTL_DEFAULT,
  HARD_TTL_LONG,
} from "./kv-cache";
import { WorkerEnvTag } from "../env";

function makeMockKv() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    store,
  };
}

function makeEnvLayer(
  mockKv: ReturnType<typeof makeMockKv>,
  overrides: { CACHE_LONG_TTL?: string } = {},
) {
  return Layer.succeed(WorkerEnvTag, {
    PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
    PSD_IMAGE_BASE_URL: "https://kcvv.prosoccerdata.com",
    FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
    PSD_API_KEY: "test-key",
    PSD_API_CLUB: "test-club",
    PSD_API_AUTH: "test-auth",
    PSD_CACHE: mockKv as unknown as KVNamespace,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "test",
    SANITY_API_TOKEN: "test-token",
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
    ...overrides,
  });
}

const TestSchema = S.Struct({ name: S.String, value: S.Number });

/** Helper to create a cached wrapper entry */
function makeWrapper(value: unknown, ageMs: number) {
  return JSON.stringify({ value, fetchedAt: Date.now() - ageMs });
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

  it("STATS is 24 hours", () => {
    expect(TTL.STATS).toBe(60 * 60 * 24);
  });

  it("MATCH_DETAIL_LIVE does not exist", () => {
    expect("MATCH_DETAIL_LIVE" in TTL).toBe(false);
  });

  it("MATCH_DETAIL_DEFAULT is 24 hours", () => {
    expect(TTL.MATCH_DETAIL_DEFAULT).toBe(60 * 60 * 24);
  });

  it("MATCH_DETAIL_PAST is 7 days (unchanged)", () => {
    expect(TTL.MATCH_DETAIL_PAST).toBe(60 * 60 * 24 * 7);
  });

  it("HARD_TTL_DEFAULT is 7 days", () => {
    expect(HARD_TTL_DEFAULT).toBe(60 * 60 * 24 * 7);
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

  it("stale + successful refresh: updates cache with fresh value", async () => {
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
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "fresh", value: 42 });
    // Cache should be updated with new wrapper
    const stored = JSON.parse(mockKv.put.mock.calls[0]![1]);
    expect(stored.value).toEqual({ name: "fresh", value: 42 });
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
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "stale", value: 99 });
    // Should NOT update cache on error
    expect(mockKv.put).not.toHaveBeenCalled();
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
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "fallback", value: 1 });
    expect(fetchCalled).toBe(true);
  });

  it("cache hit with old format (no wrapper): logs warning, falls through to fetch", async () => {
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
          Effect.provide(makeEnvLayer(mockKv)),
        ),
    );

    expect(result).toEqual({ name: "fresh", value: 42 });
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
          Effect.provide(makeEnvLayer(mockKv, { CACHE_LONG_TTL: "true" })),
        ),
    );

    expect(mockKv.put).toHaveBeenCalledWith("test-key", expect.any(String), {
      expirationTtl: HARD_TTL_LONG,
    });
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
        Effect.provide(makeEnvLayer(mockKv)),
      ),
    );
    expect(result).toBe("hello");
    expect(mockKv.put).toHaveBeenCalledWith("test-key", "hello", {
      expirationTtl: 60,
    });
  });
});
