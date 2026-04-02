import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { getRelatedHandler } from "./related";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import {
  VectorizeService,
  type VectorizeServiceInterface,
} from "../search/vectorize";
import { testEnvLayer } from "../test-helpers/env-layer";

function makeCacheMock(
  overrides: Partial<KvCacheInterface> = {},
): KvCacheInterface {
  return {
    get: () => Effect.succeed(null),
    set: () => Effect.succeed(undefined),
    increment: () => Effect.succeed(undefined),
    ...overrides,
  };
}

function makeVectorizeMock(
  overrides: Partial<VectorizeServiceInterface> = {},
): VectorizeServiceInterface {
  return {
    upsert: () => Effect.succeed(undefined),
    query: () => Effect.succeed([]),
    getByIds: () => Effect.succeed([]),
    deleteByIds: () => Effect.succeed(undefined as void),
    ...overrides,
  };
}

function runWithProviders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  effect: Effect.Effect<any, any, any>,
  cacheMock: KvCacheInterface = makeCacheMock(),
  vectorizeMock: VectorizeServiceInterface = makeVectorizeMock(),
) {
  return Effect.runPromise(
    effect.pipe(
      Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      Effect.provide(Layer.succeed(VectorizeService, vectorizeMock)),
      Effect.provide(testEnvLayer),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as Effect.Effect<any, never, never>,
  );
}

describe("getRelatedHandler", () => {
  it("returns cached result on cache hit without calling Vectorize", async () => {
    const cachedItems = [
      {
        id: "doc-1",
        slug: "article-1",
        type: "article",
        score: 0.9,
        title: "Cached Article",
        excerpt: "From cache",
        imageUrl: null,
      },
    ];
    const cached = JSON.stringify({
      value: cachedItems,
      fetchedAt: Date.now(),
    });

    const getByIds = vi.fn(() => Effect.succeed([]));

    const result = await runWithProviders(
      getRelatedHandler({ id: "doc-1", limit: 4 }),
      makeCacheMock({ get: () => Effect.succeed(cached) }),
      makeVectorizeMock({ getByIds }),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe("Cached Article");
    expect(getByIds).not.toHaveBeenCalled();
  });

  it("caches MAX_LIMIT results and slices for smaller requests on second call", async () => {
    const FAKE_VECTOR = Array(1024).fill(0.1);
    const threeItems = [
      {
        id: "doc-2",
        score: 0.9,
        metadata: {
          slug: "art-2",
          type: "article",
          title: "Art 2",
          excerpt: "Ex 2",
        },
      },
      {
        id: "doc-3",
        score: 0.85,
        metadata: {
          slug: "art-3",
          type: "article",
          title: "Art 3",
          excerpt: "Ex 3",
        },
      },
      {
        id: "doc-4",
        score: 0.8,
        metadata: {
          slug: "page-4",
          type: "page",
          title: "Page 4",
          excerpt: "Ex 4",
        },
      },
    ];

    let stored: string | null = null;
    const set = vi.fn((_key: string, value: string, _ttl: number) => {
      stored = value;
      return Effect.succeed(undefined);
    });

    // First call: limit 1 — should store all 3 results and return 1
    const result1 = await runWithProviders(
      getRelatedHandler({ id: "doc-1", limit: 1 }),
      makeCacheMock({ set }),
      makeVectorizeMock({
        getByIds: () =>
          Effect.succeed([{ id: "doc-1", values: FAKE_VECTOR, metadata: {} }]),
        query: () => Effect.succeed(threeItems),
      }),
    );

    expect(result1).toHaveLength(1);
    expect(set).toHaveBeenCalledWith(
      "related:doc-1:max",
      expect.stringContaining("doc-2"),
      expect.any(Number),
    );

    // Second call: limit 4 — should return 3 from cache without hitting Vectorize
    const getByIds = vi.fn(() => Effect.succeed([]));
    const query = vi.fn(() => Effect.succeed([]));

    const result2 = await runWithProviders(
      getRelatedHandler({ id: "doc-1", limit: 4 }),
      makeCacheMock({ get: () => Effect.succeed(stored) }),
      makeVectorizeMock({ getByIds, query }),
    );

    expect(result2).toHaveLength(3); // 3 cached items, limit 4 returns all
    expect(getByIds).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it("stores result in KV on cache miss", async () => {
    const set = vi.fn(() => Effect.succeed(undefined));
    const FAKE_VECTOR = Array(1024).fill(0.1);

    const result = await runWithProviders(
      getRelatedHandler({ id: "doc-1", limit: 4 }),
      makeCacheMock({ set }),
      makeVectorizeMock({
        getByIds: () =>
          Effect.succeed([{ id: "doc-1", values: FAKE_VECTOR, metadata: {} }]),
        query: () =>
          Effect.succeed([
            {
              id: "doc-2",
              score: 0.8,
              metadata: {
                slug: "art",
                type: "article",
                title: "Art",
                excerpt: "Ex",
              },
            },
          ]),
      }),
    );

    expect(result).toHaveLength(1);
    expect(set).toHaveBeenCalledWith(
      "related:doc-1:max",
      expect.stringContaining("doc-2"),
      expect.any(Number),
    );
  });
});
