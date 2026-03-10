import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { KvCacheService, KvCacheLive } from "./kv-cache";
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
