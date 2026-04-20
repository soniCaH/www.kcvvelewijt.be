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
  return {
    upsert: () => Effect.succeed(undefined),
    query: () => Effect.succeed(opts.matches ?? []),
    getByIds: () => Effect.succeed(opts.stored ?? []),
    deleteByIds: () => Effect.succeed(undefined as void),
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
    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [{ id: "doc-abc", values: FAKE_VECTOR, metadata: {} }],
              matches: [
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
              ],
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
    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [{ id: "doc-abc", values: FAKE_VECTOR, metadata: {} }],
              matches: [
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
              ],
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
    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [{ id: "doc-abc", values: FAKE_VECTOR, metadata: {} }],
              matches: [
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
              ],
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
    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 1 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [{ id: "doc-abc", values: FAKE_VECTOR, metadata: {} }],
              matches: [
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
                  metadata: {
                    slug: "a",
                    type: "article",
                    title: "A",
                    excerpt: "A",
                  },
                },
                {
                  id: "doc-2",
                  score: 0.8,
                  metadata: {
                    slug: "b",
                    type: "article",
                    title: "B",
                    excerpt: "B",
                  },
                },
              ],
            }),
          ),
        ),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("doc-1");
  });

  it("forwards imageUrl from Vectorize metadata to the response", async () => {
    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [{ id: "doc-abc", values: FAKE_VECTOR, metadata: {} }],
              matches: [
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
                  id: "doc-with-image",
                  score: 0.9,
                  metadata: {
                    slug: "with-image",
                    type: "article",
                    title: "With image",
                    excerpt: "",
                    imageUrl:
                      "https://cdn.sanity.io/images/vhb33jaz/production/abc.jpg",
                  },
                },
              ],
            }),
          ),
        ),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.imageUrl).toBe(
      "https://cdn.sanity.io/images/vhb33jaz/production/abc.jpg",
    );
  });

  it("returns imageUrl as null when Vectorize metadata lacks the field", async () => {
    const result = await Effect.runPromise(
      handleRelated({ id: "doc-abc", limit: 3 }).pipe(
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock({
              stored: [{ id: "doc-abc", values: FAKE_VECTOR, metadata: {} }],
              matches: [
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
                  id: "doc-no-image",
                  score: 0.9,
                  metadata: {
                    slug: "no-image",
                    type: "article",
                    title: "No image",
                    excerpt: "",
                  },
                },
              ],
            }),
          ),
        ),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.imageUrl).toBeNull();
  });
});
