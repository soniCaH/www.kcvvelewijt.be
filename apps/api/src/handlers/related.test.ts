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
      "related:doc-1",
      expect.stringContaining("doc-2"),
      expect.any(Number),
    );
  });
});
