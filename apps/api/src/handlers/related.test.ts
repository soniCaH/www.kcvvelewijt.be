import { describe, it, expect, vi } from "vitest";
import { Effect, Exit, Layer } from "effect";
import { getRelatedHandler } from "./related";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { noopDurableKv } from "../test-helpers/kv-cache-mock";
import {
  VectorizeService,
  VectorizeError,
  type VectorizeServiceInterface,
} from "../search/vectorize";
import { testEnvLayer } from "../test-helpers/env-layer";
import { PsdGateService, PsdGateTest } from "../psd/gate";

function makeCacheMock(
  overrides: Partial<KvCacheInterface> = {},
): KvCacheInterface {
  return {
    get: () => Effect.succeed(null),
    set: () => Effect.succeed(undefined),
    delete: () => Effect.succeed(undefined),
    durable: noopDurableKv,
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
  gateLayer: Layer.Layer<PsdGateService> = PsdGateTest,
) {
  return Effect.runPromise(
    effect.pipe(
      Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      Effect.provide(Layer.succeed(VectorizeService, vectorizeMock)),
      Effect.provide(gateLayer),
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

    // getByIds has to answer twice: first for the self-vector (to grab the
    // query embedding), then for the candidate ids (to enrich metadata).
    const enrichRecords = threeItems.map((m) => ({
      id: m.id,
      values: FAKE_VECTOR,
      metadata: m.metadata as Record<string, string>,
    }));
    const getByIdsFirst = (ids: string[]) =>
      Effect.succeed(
        ids.includes("doc-1")
          ? [{ id: "doc-1", values: FAKE_VECTOR, metadata: {} }]
          : enrichRecords.filter((r) => ids.includes(r.id)),
      );

    // First call: limit 1 — should store all 3 results and return 1
    const result1 = await runWithProviders(
      getRelatedHandler({ id: "doc-1", limit: 1 }),
      makeCacheMock({ set }),
      makeVectorizeMock({
        getByIds: getByIdsFirst,
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

    const metadata = {
      slug: "art",
      type: "article",
      title: "Art",
      excerpt: "Ex",
    };

    const getByIds = (ids: string[]) =>
      Effect.succeed(
        ids.includes("doc-1")
          ? [{ id: "doc-1", values: FAKE_VECTOR, metadata: {} }]
          : ids.includes("doc-2")
            ? [{ id: "doc-2", values: FAKE_VECTOR, metadata }]
            : [],
      );

    const result = await runWithProviders(
      getRelatedHandler({ id: "doc-1", limit: 4 }),
      makeCacheMock({ set }),
      makeVectorizeMock({
        getByIds,
        query: () =>
          Effect.succeed([
            {
              id: "doc-2",
              score: 0.8,
              metadata: { type: "article" },
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

describe("getRelatedHandler — empty results are never stored (#3468)", () => {
  it("returns [] for an id with no related items without writing it to KV", async () => {
    const set = vi.fn(() => Effect.succeed(undefined));

    const result = await runWithProviders(
      getRelatedHandler({ id: "doc-new", limit: 3 }),
      makeCacheMock({ set }),
    );

    expect(result).toEqual([]);
    expect(set).not.toHaveBeenCalledWith(
      "related:doc-new:max",
      expect.anything(),
      expect.anything(),
    );
  });

  it("an empty result reports no PSD outage to the gate", async () => {
    const reportOutcome = vi.fn(() => Effect.succeed({ incidentOpen: false }));
    const spyGate = Layer.effect(
      PsdGateService,
      Effect.map(PsdGateService, (real) => ({ ...real, reportOutcome })),
    ).pipe(Layer.provide(PsdGateTest));

    await runWithProviders(
      getRelatedHandler({ id: "doc-new", limit: 3 }),
      makeCacheMock(),
      makeVectorizeMock(),
      spyGate,
    );

    expect(reportOutcome).not.toHaveBeenCalled();
  });

  // #3467: the stale read no longer refreshes in the foreground, so it serves
  // the stale items (as production already did, where a runner is wired) and
  // the empty refresh only marks the key. The "never keep stale for an empty
  // answer" intent of #3468 does not hold on the stale path in production.
  it("a stale entry whose refresh comes back empty is served stale", async () => {
    const stale = JSON.stringify({
      value: [
        {
          id: "doc-old",
          slug: "old",
          type: "article",
          score: 0.9,
          title: "Old",
          excerpt: "Old",
          imageUrl: null,
        },
      ],
      fetchedAt: Date.now() - 7 * 60 * 60 * 1000, // past TTL.RELATED (6 h)
    });

    const result = await runWithProviders(
      getRelatedHandler({ id: "doc-1", limit: 3 }),
      makeCacheMock({
        get: (key) =>
          Effect.succeed(key === "related:doc-1:max" ? stale : null),
      }),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("doc-old");
  });
});

describe("getRelatedHandler — Vectorize failure is a 503 (#3493)", () => {
  it.each(["getByIds", "query"] as const)(
    "fails with HttpServiceUnavailable when Vectorize %s fails",
    async (failing) => {
      const FAKE_VECTOR = Array(1024).fill(0.1);
      const exit = await runWithProviders(
        getRelatedHandler({ id: "doc-1", limit: 3 }).pipe(Effect.exit),
        makeCacheMock(),
        makeVectorizeMock({
          getByIds: () =>
            failing === "getByIds"
              ? Effect.fail(new VectorizeError("down"))
              : Effect.succeed([
                  { id: "doc-1", values: FAKE_VECTOR, metadata: {} },
                ]),
          query: () => Effect.fail(new VectorizeError("down")),
        }),
      );

      expect(Exit.isFailure(exit)).toBe(true);
      expect(JSON.stringify(exit)).toContain("HttpServiceUnavailable");
    },
  );
});
