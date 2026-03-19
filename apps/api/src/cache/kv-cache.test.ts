import { describe, it, expect, vi } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import { KvCacheService, KvCacheLive, TypedKvCache, TTL } from "./kv-cache";
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

function makeEnvLayer(mockKv: ReturnType<typeof makeMockKv>) {
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
  });
}

const TestSchema = S.Struct({ name: S.String, value: S.Number });

describe("TTL constants", () => {
  it("NEXT_MATCHES is 4 hours", () => {
    expect(TTL.NEXT_MATCHES).toBe(60 * 60 * 4);
  });
});

describe("TypedKvCache", () => {
  it("cache miss: calls fetch, caches result, returns value", async () => {
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
    expect(mockKv.put).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify({ name: "test", value: 42 }),
      { expirationTtl: 60 },
    );
  });

  it("cache hit with valid data: returns decoded value, fetch not called", async () => {
    const mockKv = makeMockKv();
    mockKv.store.set("test-key", JSON.stringify({ name: "cached", value: 99 }));

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

  it("cache hit with stale schema: logs warning, falls through to fetch", async () => {
    const mockKv = makeMockKv();
    // Valid JSON but missing required 'value' field
    mockKv.store.set("test-key", JSON.stringify({ name: "stale" }));

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
  });

  it("supports dynamic TTL function based on the fetched value", async () => {
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

    expect(mockKv.put).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify({ name: "test", value: 10 }),
      { expirationTtl: 600 },
    );
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
