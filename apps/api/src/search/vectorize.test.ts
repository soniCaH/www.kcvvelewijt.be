import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import {
  VectorizeService,
  VectorizeServiceLive,
  VectorizeError,
} from "./vectorize";
import { listPendingIds } from "./index-manifest";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import { KvCacheLive, makeDurableKv } from "../cache/kv-cache";

function makeVectorizeMock(
  overrides: Partial<VectorizeIndex> = {},
): VectorizeIndex {
  return {
    upsert: async () => ({ mutationId: "mut-123", count: 1 }),
    query: async () => ({
      matches: [
        {
          id: "doc-abc",
          score: 0.95,
          metadata: {
            slug: "kantine",
            type: "responsibility",
            title: "Kantine",
            excerpt: "De kantine...",
          },
        },
      ],
    }),
    ...overrides,
  } as unknown as VectorizeIndex;
}

/**
 * Stateful in-memory KVNamespace so a test can observe the pending-marker
 * writes `VectorizeServiceLive.upsert` now makes (#2855) — `{} as
 * KVNamespace` (used everywhere markers are irrelevant) has no
 * `get`/`put`/`list` to call at all. `list` supports the `prefix` filter
 * `listPendingIds` (index-manifest.ts) uses — single page, `list_complete:
 * true`, which is all a test-scale marker count ever needs.
 */
function makeKvNamespaceMock(): KVNamespace & {
  readonly store: Map<string, string>;
} {
  const store = new Map<string, string>();
  const mock = {
    store,
    get: (async (key: string) => store.get(key) ?? null) as KVNamespace["get"],
    put: (async (key: string, value: string) => {
      store.set(key, value);
    }) as KVNamespace["put"],
    delete: (async (key: string) => {
      store.delete(key);
    }) as KVNamespace["delete"],
    list: (async (opts?: { prefix?: string }) => {
      const prefix = opts?.prefix ?? "";
      const keys = [...store.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }));
      return {
        keys,
        list_complete: true,
        cursor: undefined,
        cacheStatus: null,
      };
    }) as KVNamespace["list"],
  };
  return mock as unknown as KVNamespace & {
    readonly store: Map<string, string>;
  };
}

/**
 * Like `makeKvNamespaceMock`, but `put` throws on the first `failCount`
 * calls before succeeding — simulates a transient KV failure for
 * `addToManifest`'s retry (index-manifest.ts's `MANIFEST_RETRY`), now
 * exercised via `VectorizeServiceLive.upsert` rather than a webhook call
 * site.
 */
function makeFlakyKvNamespaceMock(
  failCount: number,
): KVNamespace & { readonly store: Map<string, string> } {
  const store = new Map<string, string>();
  let attempts = 0;
  const mock = {
    store,
    get: (async (key: string) => store.get(key) ?? null) as KVNamespace["get"],
    put: (async (key: string, value: string) => {
      attempts++;
      if (attempts <= failCount) {
        throw new Error(`KV put failed (simulated attempt ${attempts})`);
      }
      store.set(key, value);
    }) as KVNamespace["put"],
    delete: (async (key: string) => {
      store.delete(key);
    }) as KVNamespace["delete"],
    list: (async (opts?: { prefix?: string }) => {
      const prefix = opts?.prefix ?? "";
      const keys = [...store.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }));
      return {
        keys,
        list_complete: true,
        cursor: undefined,
        cacheStatus: null,
      };
    }) as KVNamespace["list"],
  };
  return mock as unknown as KVNamespace & {
    readonly store: Map<string, string>;
  };
}

function makeEnvLayer(
  index: VectorizeIndex,
  overrides: { kv?: KVNamespace; dataset?: string } = {},
) {
  const envLayer = makeTestEnvLayer({
    SEARCH_INDEX: index,
    PSD_API_BASE_URL: "",
    PSD_IMAGE_BASE_URL: "",
    FOOTBALISTO_LOGO_CDN_URL: "",
    PSD_API_KEY: "",
    PSD_API_CLUB: "",
    PSD_API_AUTH: "",
    PSD_CACHE: overrides.kv ?? makeKvNamespaceMock(),
    SANITY_PROJECT_ID: "",
    SANITY_DATASET: overrides.dataset ?? "production",
    SANITY_API_TOKEN: "",
    SANITY_WEBHOOK_SECRET: "",
  });
  // VectorizeServiceLive needs KvCacheService now too (#2873, manifest
  // marker recording) — merged in here (not just provided) so it also
  // satisfies KvCacheLive's own WorkerEnvTag requirement below.
  return Layer.mergeAll(KvCacheLive, envLayer).pipe(Layer.provide(envLayer));
}

describe("VectorizeService", () => {
  it("upserts vectors without error", async () => {
    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(makeVectorizeMock())),
    );

    await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        yield* svc.upsert([
          {
            id: "doc-abc",
            values: Array(1024).fill(0.1),
            metadata: {
              slug: "kantine",
              type: "responsibility",
              title: "Kantine",
              excerpt: "De kantine...",
            },
          },
        ]);
      }).pipe(Effect.provide(layer)),
    );
  });

  it("returns query matches with score and metadata", async () => {
    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(makeVectorizeMock())),
    );

    const matches = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc.query(Array(1024).fill(0.1), {
          topK: 5,
          returnMetadata: "all",
        });
      }).pipe(Effect.provide(layer)),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]!.score).toBe(0.95);
    expect(matches[0]!.metadata?.["slug"]).toBe("kantine");
  });

  it("preserves all string metadata fields (including imageUrl) on query", async () => {
    const mockIndex = {
      upsert: async () => ({ mutationId: "m", count: 1 }),
      query: async () => ({
        matches: [
          {
            id: "doc-abc",
            score: 0.9,
            metadata: {
              slug: "kcvv-wint",
              type: "article",
              title: "KCVV wint",
              excerpt: "Groenwit wint de derby.",
              imageUrl:
                "https://cdn.sanity.io/images/vhb33jaz/production/x.jpg",
              tags: "A-Ploeg",
              // Non-string entries must be dropped by the service: the
              // wire type is Record<string, string>, so callers never have
              // to typeof-guard numeric or nested values.
              views: 42,
              published: true,
              nested: { foo: "bar" },
            },
          },
        ],
      }),
    } as unknown as VectorizeIndex;

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(mockIndex)),
    );

    const matches = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc.query(Array(1024).fill(0.1), {
          topK: 5,
          returnMetadata: "all",
        });
      }).pipe(Effect.provide(layer)),
    );

    // Regression: the service used to hand-roll a whitelist of four fields
    // (slug/type/title/excerpt), silently dropping imageUrl and any other
    // present fields. It must now forward every string-valued key.
    expect(matches[0]!.metadata?.["imageUrl"]).toBe(
      "https://cdn.sanity.io/images/vhb33jaz/production/x.jpg",
    );
    expect(matches[0]!.metadata?.["tags"]).toBe("A-Ploeg");
    expect(matches[0]!.metadata?.["slug"]).toBe("kcvv-wint");
    expect(matches[0]!.metadata?.["type"]).toBe("article");
    // Non-string entries are filtered out
    expect(matches[0]!.metadata?.["views"]).toBeUndefined();
    expect(matches[0]!.metadata?.["published"]).toBeUndefined();
    expect(matches[0]!.metadata?.["nested"]).toBeUndefined();
  });

  it("omits the metadata property when no string-valued fields are present", async () => {
    // Shape parity with the null-metadata case: `matches[0].metadata` must
    // be undefined, not an empty object. Callers already handle both via
    // `?.[key] ?? null`, but the wire shape should be consistent.
    const mockIndex = {
      upsert: async () => ({ mutationId: "m", count: 1 }),
      query: async () => ({
        matches: [
          {
            id: "doc-numbers-only",
            score: 0.7,
            metadata: { views: 42, published: true } as Record<string, unknown>,
          },
        ],
      }),
    } as unknown as VectorizeIndex;

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(mockIndex)),
    );

    const matches = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc.query(Array(1024).fill(0.1), {
          topK: 5,
          returnMetadata: "all",
        });
      }).pipe(Effect.provide(layer)),
    );

    expect(matches[0]!.metadata).toBeUndefined();
  });

  it("fails with VectorizeError when upsert throws", async () => {
    const failIndex = {
      upsert: async () => {
        throw new Error("Vectorize unavailable");
      },
      query: makeVectorizeMock().query,
    } as unknown as VectorizeIndex;

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(failIndex)),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc
          .upsert([
            {
              id: "x",
              values: [0.1],
              metadata: { slug: "x", type: "x", title: "x", excerpt: "x" },
            },
          ])
          .pipe(Effect.either);
      }).pipe(Effect.provide(layer)),
    );

    expect(result._tag).toBe("Left");
    expect(
      (result as Extract<typeof result, { _tag: "Left" }>).left,
    ).toBeInstanceOf(VectorizeError);
  });

  it("returns stored vectors by id", async () => {
    const mockIndex = makeVectorizeMock({
      getByIds: async () => [
        {
          id: "doc-abc",
          values: Array(1024).fill(0.1),
          metadata: {
            slug: "kantine",
            type: "responsibility",
            title: "Kantine",
            excerpt: "De kantine...",
          },
        },
      ],
    });

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(mockIndex)),
    );

    const records = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc.getByIds(["doc-abc"]);
      }).pipe(Effect.provide(layer)),
    );

    expect(records).toHaveLength(1);
    expect(records[0]!.id).toBe("doc-abc");
    expect(records[0]!.values).toHaveLength(1024);
  });

  it("returns empty array when getByIds finds nothing", async () => {
    const mockIndex = makeVectorizeMock({
      getByIds: async () => [],
    });

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(mockIndex)),
    );

    const records = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc.getByIds(["nonexistent"]);
      }).pipe(Effect.provide(layer)),
    );

    expect(records).toHaveLength(0);
  });

  it("fails with VectorizeError when getByIds throws", async () => {
    const failIndex = makeVectorizeMock({
      getByIds: async () => {
        throw new Error("Vectorize unavailable");
      },
    });

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(failIndex)),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc.getByIds(["doc-abc"]).pipe(Effect.either);
      }).pipe(Effect.provide(layer)),
    );

    expect(result._tag).toBe("Left");
    expect(
      (result as Extract<typeof result, { _tag: "Left" }>).left,
    ).toBeInstanceOf(VectorizeError);
  });

  it("deletes vectors by ids", async () => {
    const receivedIds: string[][] = [];
    const mockIndex = makeVectorizeMock({
      deleteByIds: async (ids: string[]) => {
        receivedIds.push(ids);
        return {
          mutationId: "mut-del",
          count: 1,
          ids: ["doc-abc"],
        };
      },
    });

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(mockIndex)),
    );

    await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        yield* svc.deleteByIds(["doc-abc"]);
      }).pipe(Effect.provide(layer)),
    );

    expect(receivedIds).toEqual([["doc-abc"]]);
  });

  it("fails with VectorizeError when deleteByIds throws", async () => {
    const failIndex = makeVectorizeMock({
      deleteByIds: async () => {
        throw new Error("Vectorize unavailable");
      },
    });

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(failIndex)),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc.deleteByIds(["doc-abc"]).pipe(Effect.either);
      }).pipe(Effect.provide(layer)),
    );

    expect(result._tag).toBe("Left");
    expect(
      (result as Extract<typeof result, { _tag: "Left" }>).left,
    ).toBeInstanceOf(VectorizeError);
  });

  it("fails with VectorizeError when query throws", async () => {
    const failIndex = {
      upsert: makeVectorizeMock().upsert,
      query: async () => {
        throw new Error("Vectorize unavailable");
      },
    } as unknown as VectorizeIndex;

    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(failIndex)),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc
          .query(Array(1024).fill(0.1), { topK: 5, returnMetadata: "all" })
          .pipe(Effect.either);
      }).pipe(Effect.provide(layer)),
    );

    expect(result._tag).toBe("Left");
    expect(
      (result as Extract<typeof result, { _tag: "Left" }>).left,
    ).toBeInstanceOf(VectorizeError);
  });

  describe("manifest ownership (#2855)", () => {
    // upsert's confirmed ids are recorded as put-only pending markers
    // (index-manifest.ts's `addToManifest`/`listPendingIds`), not written
    // into the shared manifest array directly — a read-modify-write there
    // would race across concurrent callers on Workers KV's eventually
    // consistent, per-key-throttled store (see vectorize.ts's
    // `recordUpsertedIds` docblock). Folding markers into the array stays
    // the nightly sweep's job (sanity-index-sync.test.ts covers that).
    it("records every successfully upserted id as a pending manifest marker", async () => {
      const kv = makeKvNamespaceMock();
      const layer = VectorizeServiceLive.pipe(
        Layer.provide(makeEnvLayer(makeVectorizeMock(), { kv })),
      );

      await Effect.runPromise(
        Effect.gen(function* () {
          const svc = yield* VectorizeService;
          yield* svc.upsert([
            {
              id: "doc-abc",
              values: Array(1024).fill(0.1),
              metadata: { slug: "kantine", type: "responsibility" },
            },
            {
              id: "doc-def",
              values: Array(1024).fill(0.1),
              metadata: { slug: "bar", type: "responsibility" },
            },
          ]);
        }).pipe(Effect.provide(layer)),
      );

      const pending = await Effect.runPromise(
        listPendingIds(makeDurableKv(kv).forDataset("production")),
      );
      expect(new Set(pending.ids)).toEqual(new Set(["doc-abc", "doc-def"]));
    });

    it("does not write a pending marker when upsert fails", async () => {
      const kv = makeKvNamespaceMock();
      const failIndex = {
        upsert: async () => {
          throw new Error("Vectorize unavailable");
        },
      } as unknown as VectorizeIndex;
      const layer = VectorizeServiceLive.pipe(
        Layer.provide(makeEnvLayer(failIndex, { kv })),
      );

      await Effect.runPromise(
        Effect.gen(function* () {
          const svc = yield* VectorizeService;
          return yield* svc
            .upsert([
              {
                id: "doc-new",
                values: [0.1],
                metadata: { slug: "x", type: "x" },
              },
            ])
            .pipe(Effect.either);
        }).pipe(Effect.provide(layer)),
      );

      const pending = await Effect.runPromise(
        listPendingIds(makeDurableKv(kv).forDataset("production")),
      );
      expect(pending.ids).toHaveLength(0);
    });

    it("retries a transient marker-write failure and still records the id", async () => {
      const kv = makeFlakyKvNamespaceMock(1); // fails once, succeeds after
      const layer = VectorizeServiceLive.pipe(
        Layer.provide(makeEnvLayer(makeVectorizeMock(), { kv })),
      );

      await Effect.runPromise(
        Effect.gen(function* () {
          const svc = yield* VectorizeService;
          yield* svc.upsert([
            {
              id: "doc-retry",
              values: [0.1],
              metadata: { slug: "x", type: "x" },
            },
          ]);
        }).pipe(Effect.provide(layer)),
      );

      const pending = await Effect.runPromise(
        listPendingIds(makeDurableKv(kv).forDataset("production")),
      );
      expect(pending.ids).toEqual(["doc-retry"]);
    });

    it("does not fail the upsert when every marker-write retry is exhausted", async () => {
      const kv = makeFlakyKvNamespaceMock(Infinity); // never succeeds
      const layer = VectorizeServiceLive.pipe(
        Layer.provide(makeEnvLayer(makeVectorizeMock(), { kv })),
      );

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const svc = yield* VectorizeService;
          return yield* svc
            .upsert([
              {
                id: "doc-unlucky",
                values: [0.1],
                metadata: { slug: "x", type: "x" },
              },
            ])
            .pipe(Effect.either);
        }).pipe(Effect.provide(layer)),
      );

      expect(result._tag).toBe("Right");
    });

    it("survives two concurrent upserts for different ids (#2856) — no shared read to race on", async () => {
      // The defect #2856 fixed: a read-modify-write manifest update has both
      // callers read the same array before either writes, so whichever
      // writes last wins and the other addition is lost. A put-only marker
      // per id has no shared read to race on. Genuinely concurrent — both
      // upserts are started before either is awaited.
      const kv = makeKvNamespaceMock();
      const layer = VectorizeServiceLive.pipe(
        Layer.provide(makeEnvLayer(makeVectorizeMock(), { kv })),
      );
      const run = (id: string) =>
        Effect.runPromise(
          Effect.gen(function* () {
            const svc = yield* VectorizeService;
            yield* svc.upsert([
              { id, values: [0.1], metadata: { slug: "x", type: "x" } },
            ]);
          }).pipe(Effect.provide(layer)),
        );

      await Promise.all([run("concurrent-a"), run("concurrent-b")]);

      const pending = await Effect.runPromise(
        listPendingIds(makeDurableKv(kv).forDataset("production")),
      );
      expect(new Set(pending.ids)).toEqual(
        new Set(["concurrent-a", "concurrent-b"]),
      );
    });

    it("does not touch any manifest state on deleteByIds — that stays the sweep's responsibility", async () => {
      // Pre-#2855, a webhook delete never updated the manifest either — the
      // array only ever drops an id via the nightly sweep's own
      // confirmed-delete reconciliation. Mirroring the ADD side with a
      // "pending delete" marker here would be new complexity #2855 never
      // asked for; deleteByIds must stay a pure passthrough to Vectorize.
      const kv = makeKvNamespaceMock();
      const layer = VectorizeServiceLive.pipe(
        Layer.provide(
          makeEnvLayer(
            makeVectorizeMock({
              deleteByIds: async () => ({
                mutationId: "mut-del",
                count: 1,
                ids: ["doc-abc"],
              }),
            }),
            { kv },
          ),
        ),
      );

      await Effect.runPromise(
        Effect.gen(function* () {
          const svc = yield* VectorizeService;
          yield* svc.deleteByIds(["doc-abc"]);
        }).pipe(Effect.provide(layer)),
      );

      expect(kv.store.size).toBe(0);
    });

    it("keeps staging and production pending markers on separate keys sharing the same KV (#2833 regression)", async () => {
      const kv = makeKvNamespaceMock();
      const stagingLayer = VectorizeServiceLive.pipe(
        Layer.provide(
          makeEnvLayer(makeVectorizeMock(), { kv, dataset: "staging" }),
        ),
      );
      const productionLayer = VectorizeServiceLive.pipe(
        Layer.provide(
          makeEnvLayer(makeVectorizeMock(), { kv, dataset: "production" }),
        ),
      );

      await Effect.runPromise(
        Effect.gen(function* () {
          const svc = yield* VectorizeService;
          yield* svc.upsert([
            {
              id: "staging-only",
              values: [0.1],
              metadata: { slug: "x", type: "x" },
            },
          ]);
        }).pipe(Effect.provide(stagingLayer)),
      );
      await Effect.runPromise(
        Effect.gen(function* () {
          const svc = yield* VectorizeService;
          yield* svc.upsert([
            {
              id: "production-only",
              values: [0.1],
              metadata: { slug: "x", type: "x" },
            },
          ]);
        }).pipe(Effect.provide(productionLayer)),
      );

      const stagingPending = await Effect.runPromise(
        listPendingIds(makeDurableKv(kv).forDataset("staging")),
      );
      const productionPending = await Effect.runPromise(
        listPendingIds(makeDurableKv(kv).forDataset("production")),
      );
      expect(stagingPending.ids).toEqual(["staging-only"]);
      expect(productionPending.ids).toEqual(["production-only"]);
    });
  });
});
