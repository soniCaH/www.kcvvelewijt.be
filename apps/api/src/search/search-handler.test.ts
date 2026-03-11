import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { handleSearch, MIN_SCORE } from "./search-handler";
import { EmbeddingService, type EmbeddingServiceInterface } from "./embedding";
import {
  VectorizeService,
  type VectorizeServiceInterface,
  type VectorizeMatch,
} from "./vectorize";

const FAKE_VECTOR = Array(1024).fill(0.1);

function makeEmbeddingMock(): EmbeddingServiceInterface {
  return { embed: () => Effect.succeed(FAKE_VECTOR) };
}

function makeVectorizeMock(
  matches: VectorizeMatch[],
): VectorizeServiceInterface {
  return {
    upsert: () => Effect.succeed(undefined),
    query: () => Effect.succeed(matches),
  };
}

describe("handleSearch", () => {
  it("returns ranked results", async () => {
    const result = await Effect.runPromise(
      handleSearch({ query: "wie regelt de kantine", limit: 5 }).pipe(
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock([
              {
                id: "doc-abc",
                score: 0.95,
                metadata: {
                  slug: "kantine-evenementen",
                  type: "responsibilityPath",
                  title: "Kantine",
                  excerpt: "De kantine...",
                },
              },
            ]),
          ),
        ),
      ),
    );

    expect(result.results).toHaveLength(1);
    expect(result.results[0]!.slug).toBe("kantine-evenementen");
    expect(result.results[0]!.score).toBe(0.95);
  });

  it("returns empty results when no matches", async () => {
    const result = await Effect.runPromise(
      handleSearch({ query: "unknown", limit: 5 }).pipe(
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, makeVectorizeMock([]))),
      ),
    );
    expect(result.results).toHaveLength(0);
  });

  it(`filters results below MIN_SCORE (${MIN_SCORE})`, async () => {
    const result = await Effect.runPromise(
      handleSearch({ query: "vague", limit: 5 }).pipe(
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock([
              {
                id: "low",
                score: MIN_SCORE - 0.2,
                metadata: {
                  slug: "x",
                  type: "responsibilityPath",
                  title: "X",
                  excerpt: "X",
                },
              },
              {
                id: "high",
                score: MIN_SCORE + 0.3,
                metadata: {
                  slug: "y",
                  type: "responsibilityPath",
                  title: "Y",
                  excerpt: "Y",
                },
              },
            ]),
          ),
        ),
      ),
    );

    expect(result.results.map((r) => r.id)).not.toContain("low");
    expect(result.results.map((r) => r.id)).toContain("high");
  });

  it("applies exact MIN_SCORE boundary: excludes 0.349, includes 0.35 and 0.351", async () => {
    const makeHit = (id: string, score: number): VectorizeMatch => ({
      id,
      score,
      metadata: {
        slug: id,
        type: "responsibilityPath",
        title: id,
        excerpt: id,
      },
    });
    const result = await Effect.runPromise(
      handleSearch({ query: "test", limit: 10 }).pipe(
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(
          Layer.succeed(
            VectorizeService,
            makeVectorizeMock([
              makeHit("below", 0.349),
              makeHit("at", 0.35),
              makeHit("above", 0.351),
            ]),
          ),
        ),
      ),
    );

    const ids = result.results.map((r) => r.id);
    expect(ids, `MIN_SCORE is ${MIN_SCORE}`).not.toContain("below");
    expect(ids, `MIN_SCORE is ${MIN_SCORE}`).toContain("at");
    expect(ids, `MIN_SCORE is ${MIN_SCORE}`).toContain("above");
  });

  it("passes type filter to Vectorize query", async () => {
    let capturedFilter: Record<string, string> | undefined;
    const capturingVectorize: VectorizeServiceInterface = {
      upsert: () => Effect.succeed(undefined),
      query: (_vec, opts) =>
        Effect.sync(() => {
          capturedFilter = opts.filter;
          return [];
        }),
    };

    await Effect.runPromise(
      handleSearch({ query: "test", type: "responsibility", limit: 5 }).pipe(
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, capturingVectorize)),
      ),
    );

    expect(capturedFilter?.["type"]).toBe("responsibilityPath");
  });
});
