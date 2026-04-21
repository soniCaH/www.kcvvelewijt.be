import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { handleRelated } from "./related-handler";
import {
  VectorizeService,
  type VectorizeServiceInterface,
  type VectorizeMatch,
  type VectorRecord,
} from "./vectorize";

const FAKE_VECTOR = Array(1024).fill(0.1);

function makeVectorizeMock(opts: {
  stored?: VectorRecord[];
  matches?: VectorizeMatch[];
}): VectorizeServiceInterface {
  // `stored` carries the self-vector (keyed by handler's request id) plus any
  // vectors that handleRelated will look up via getByIds after ranking.
  const records = opts.stored ?? [];
  return {
    upsert: () => Effect.succeed(undefined),
    query: () => Effect.succeed(opts.matches ?? []),
    getByIds: (ids: string[]) =>
      Effect.succeed(records.filter((r) => ids.includes(r.id))),
    deleteByIds: () => Effect.succeed(undefined as void),
  };
}

// Build a VectorRecord from a VectorizeMatch so mock `stored` stays in sync
// with `matches` metadata without rewriting every test fixture.
function storeFromMatch(m: VectorizeMatch): VectorRecord {
  return {
    id: m.id,
    values: FAKE_VECTOR,
    metadata: (m.metadata ?? {}) as Record<string, string>,
  };
}

describe("handleRelated", () => {
  it("returns empty results when id not found in Vectorize", async () => {
    const result = await Effect.runPromise(
      handleRelated({ id: "nonexistent", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(VectorizeService, makeVectorizeMock({ stored: [] })),
        ),
      ),
    );

    expect(result).toHaveLength(0);
  });

  it("excludes the queried document from results", async () => {
    const matches: VectorizeMatch[] = [
      {
        id: "doc-abc",
        score: 1.0,
        metadata: {
          slug: "self",
          type: "article",
          title: "Self",
          excerpt: "Self",
        },
      },
      {
        id: "doc-def",
        score: 0.85,
        metadata: {
          slug: "related",
          type: "article",
          title: "Related",
          excerpt: "Related item",
        },
      },
    ];

    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [
                { id: "doc-abc", values: FAKE_VECTOR, metadata: {} },
                ...matches.map(storeFromMatch),
              ],
              matches,
            }),
          ),
        ),
      ),
    );

    expect(result.map((r) => r.id)).not.toContain("doc-abc");
    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe("related");
  });

  it("returns only article and page results, skipping responsibility neighbours", async () => {
    const matches: VectorizeMatch[] = [
      {
        id: "doc-abc",
        score: 1.0,
        metadata: {
          slug: "self",
          type: "article",
          title: "Self",
          excerpt: "Self",
        },
      },
      {
        id: "doc-path",
        score: 0.9,
        metadata: {
          slug: "blessure",
          type: "responsibility",
          title: "Blessure melden",
          excerpt: "Hoe meld je...",
        },
      },
      {
        id: "doc-article",
        score: 0.8,
        metadata: {
          slug: "nieuws-blessure",
          type: "article",
          title: "Blessure nieuws",
          excerpt: "Een nieuwsbericht...",
        },
      },
    ];

    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [
                { id: "doc-abc", values: FAKE_VECTOR, metadata: {} },
                ...matches.map(storeFromMatch),
              ],
              matches,
            }),
          ),
        ),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("article");
    expect(result[0]!.id).toBe("doc-article");
  });

  it("excludes responsibility type items from results", async () => {
    const matches: VectorizeMatch[] = [
      {
        id: "doc-abc",
        score: 1.0,
        metadata: {
          slug: "self",
          type: "responsibility",
          title: "Self",
          excerpt: "",
        },
      },
      {
        id: "doc-path",
        score: 0.9,
        metadata: {
          slug: "path",
          type: "responsibility",
          title: "Path",
          excerpt: "",
        },
      },
      {
        id: "doc-article",
        score: 0.8,
        metadata: {
          slug: "article",
          type: "article",
          title: "Article",
          excerpt: "An article",
        },
      },
    ];

    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [
                { id: "doc-abc", values: FAKE_VECTOR, metadata: {} },
                ...matches.map(storeFromMatch),
              ],
              matches,
            }),
          ),
        ),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("doc-article");
    expect(result[0]!.type).toBe("article");
  });

  it("respects the limit parameter", async () => {
    const matches: VectorizeMatch[] = [
      {
        id: "doc-abc",
        score: 1.0,
        metadata: {
          slug: "self",
          type: "article",
          title: "Self",
          excerpt: "",
        },
      },
      {
        id: "doc-1",
        score: 0.9,
        metadata: { slug: "a", type: "article", title: "A", excerpt: "A" },
      },
      {
        id: "doc-2",
        score: 0.8,
        metadata: { slug: "b", type: "article", title: "B", excerpt: "B" },
      },
    ];

    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 1 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [
                { id: "doc-abc", values: FAKE_VECTOR, metadata: {} },
                ...matches.map(storeFromMatch),
              ],
              matches,
            }),
          ),
        ),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("doc-1");
  });

  it("forwards imageUrl from Vectorize getByIds metadata to the response", async () => {
    // Regression: the Vectorize query binding only returns indexed metadata,
    // so handleRelated must enrich via getByIds to pick up non-indexed
    // fields like imageUrl.
    const matches: VectorizeMatch[] = [
      {
        id: "doc-abc",
        score: 1.0,
        // query() payload is what the binding returns — metadata may be
        // incomplete. The indexed `type` field is what the responsibility
        // filter relies on.
        metadata: { type: "article" },
      },
      {
        id: "doc-with-image",
        score: 0.9,
        metadata: { type: "article" },
      },
    ];

    const storedMeta = {
      slug: "with-image",
      type: "article",
      title: "With image",
      excerpt: "",
      imageUrl: "https://cdn.sanity.io/images/vhb33jaz/production/abc.jpg",
    };

    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [
                { id: "doc-abc", values: FAKE_VECTOR, metadata: {} },
                {
                  id: "doc-with-image",
                  values: FAKE_VECTOR,
                  metadata: storedMeta,
                },
              ],
              matches,
            }),
          ),
        ),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.imageUrl).toBe(
      "https://cdn.sanity.io/images/vhb33jaz/production/abc.jpg",
    );
    expect(result[0]!.title).toBe("With image");
    expect(result[0]!.slug).toBe("with-image");
  });

  it("returns imageUrl as null when Vectorize getByIds metadata lacks the field", async () => {
    const matches: VectorizeMatch[] = [
      {
        id: "doc-abc",
        score: 1.0,
        metadata: { type: "article" },
      },
      {
        id: "doc-no-image",
        score: 0.9,
        metadata: { type: "article" },
      },
    ];

    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [
                { id: "doc-abc", values: FAKE_VECTOR, metadata: {} },
                {
                  id: "doc-no-image",
                  values: FAKE_VECTOR,
                  metadata: {
                    slug: "no-image",
                    type: "article",
                    title: "No image",
                    excerpt: "",
                  },
                },
              ],
              matches,
            }),
          ),
        ),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.imageUrl).toBeNull();
  });

  it("preserves score ordering from query even when getByIds returns a different order", async () => {
    const matches: VectorizeMatch[] = [
      { id: "doc-abc", score: 1.0, metadata: { type: "article" } },
      { id: "doc-high", score: 0.9, metadata: { type: "article" } },
      { id: "doc-mid", score: 0.8, metadata: { type: "article" } },
      { id: "doc-low", score: 0.7, metadata: { type: "article" } },
    ];

    // Note: `stored` order is deliberately different from `matches` order.
    // The handler must still return results in score-descending order.
    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [
                { id: "doc-abc", values: FAKE_VECTOR, metadata: {} },
                {
                  id: "doc-low",
                  values: FAKE_VECTOR,
                  metadata: {
                    slug: "low",
                    type: "article",
                    title: "Low",
                    excerpt: "",
                  },
                },
                {
                  id: "doc-high",
                  values: FAKE_VECTOR,
                  metadata: {
                    slug: "high",
                    type: "article",
                    title: "High",
                    excerpt: "",
                  },
                },
                {
                  id: "doc-mid",
                  values: FAKE_VECTOR,
                  metadata: {
                    slug: "mid",
                    type: "article",
                    title: "Mid",
                    excerpt: "",
                  },
                },
              ],
              matches,
            }),
          ),
        ),
      ),
    );

    expect(result.map((r) => r.id)).toEqual(["doc-high", "doc-mid", "doc-low"]);
    expect(result.map((r) => r.score)).toEqual([0.9, 0.8, 0.7]);
  });
});
