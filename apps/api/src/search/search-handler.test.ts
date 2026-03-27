import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { handleSearch, MIN_SCORE, LLM_SCORE_THRESHOLD } from "./search-handler";
import {
  EmbeddingService,
  EmbeddingError,
  type EmbeddingServiceInterface,
} from "./embedding";
import {
  VectorizeService,
  VectorizeError,
  type VectorizeServiceInterface,
  type VectorizeMatch,
} from "./vectorize";
import {
  AiAnswerService,
  AiAnswerError,
  type AiAnswerServiceInterface,
} from "./ai-answer";

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
    getByIds: () => Effect.succeed([]),
  };
}

function makeAiAnswerMock(answer?: string): AiAnswerServiceInterface {
  return {
    generateAnswer: () => Effect.succeed(answer),
  };
}

function provideAllServices<A, E>(
  effect: Effect.Effect<
    A,
    E,
    EmbeddingService | VectorizeService | AiAnswerService
  >,
  opts: {
    matches?: VectorizeMatch[];
    aiAnswer?: string;
    aiService?: AiAnswerServiceInterface;
  } = {},
) {
  return effect.pipe(
    Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
    Effect.provide(
      Layer.succeed(VectorizeService, makeVectorizeMock(opts.matches ?? [])),
    ),
    Effect.provide(
      Layer.succeed(
        AiAnswerService,
        opts.aiService ?? makeAiAnswerMock(opts.aiAnswer),
      ),
    ),
  );
}

const makeHit = (id: string, score: number): VectorizeMatch => ({
  id,
  score,
  metadata: {
    slug: id,
    type: "responsibility",
    title: id,
    excerpt: `Excerpt for ${id}`,
  },
});

describe("handleSearch", () => {
  it("returns ranked results", async () => {
    const result = await Effect.runPromise(
      provideAllServices(
        handleSearch({ query: "wie regelt de kantine", limit: 5 }),
        {
          matches: [
            {
              id: "doc-abc",
              score: 0.95,
              metadata: {
                slug: "kantine-evenementen",
                type: "responsibility",
                title: "Kantine",
                excerpt: "De kantine...",
              },
            },
          ],
          aiAnswer: "De kantine wordt beheerd door...",
        },
      ),
    );

    expect(result.results).toHaveLength(1);
    expect(result.results[0]!.slug).toBe("kantine-evenementen");
    expect(result.results[0]!.score).toBe(0.95);
  });

  it("returns empty results when no matches", async () => {
    const result = await Effect.runPromise(
      provideAllServices(handleSearch({ query: "unknown", limit: 5 })),
    );
    expect(result.results).toHaveLength(0);
  });

  it(`filters results below MIN_SCORE (${MIN_SCORE})`, async () => {
    const result = await Effect.runPromise(
      provideAllServices(handleSearch({ query: "vague", limit: 5 }), {
        matches: [
          makeHit("low", MIN_SCORE - 0.2),
          makeHit("high", MIN_SCORE + 0.3),
        ],
      }),
    );

    expect(result.results.map((r) => r.id)).not.toContain("low");
    expect(result.results.map((r) => r.id)).toContain("high");
  });

  it("applies exact MIN_SCORE boundary: excludes 0.349, includes 0.35 and 0.351", async () => {
    const result = await Effect.runPromise(
      provideAllServices(handleSearch({ query: "test", limit: 10 }), {
        matches: [
          makeHit("below", 0.349),
          makeHit("at", 0.35),
          makeHit("above", 0.351),
        ],
      }),
    );

    const ids = result.results.map((r) => r.id);
    expect(ids, `MIN_SCORE is ${MIN_SCORE}`).not.toContain("below");
    expect(ids, `MIN_SCORE is ${MIN_SCORE}`).toContain("at");
    expect(ids, `MIN_SCORE is ${MIN_SCORE}`).toContain("above");
  });

  it("propagates EmbeddingError when embed fails", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        handleSearch({ query: "test", limit: 5 }).pipe(
          Effect.provide(
            Layer.succeed(EmbeddingService, {
              embed: () =>
                Effect.fail(new EmbeddingError("AI service unavailable")),
            }),
          ),
          Effect.provide(
            Layer.succeed(VectorizeService, makeVectorizeMock([])),
          ),
          Effect.provide(Layer.succeed(AiAnswerService, makeAiAnswerMock())),
        ),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("EmbeddingError");
    }
  });

  it("propagates VectorizeError when query fails", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        handleSearch({ query: "test", limit: 5 }).pipe(
          Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
          Effect.provide(
            Layer.succeed(VectorizeService, {
              upsert: () => Effect.succeed(undefined),
              query: () =>
                Effect.fail(new VectorizeError("Vectorize unavailable")),
              getByIds: () => Effect.succeed([]),
            }),
          ),
          Effect.provide(Layer.succeed(AiAnswerService, makeAiAnswerMock())),
        ),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("VectorizeError");
    }
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
      getByIds: () => Effect.succeed([]),
    };

    await Effect.runPromise(
      handleSearch({ query: "test", type: "responsibility", limit: 5 }).pipe(
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, capturingVectorize)),
        Effect.provide(Layer.succeed(AiAnswerService, makeAiAnswerMock())),
      ),
    );

    expect(capturedFilter?.["type"]).toBe("responsibility");
  });
});

describe("handleSearch — LLM answer", () => {
  it("includes answer when top score >= LLM_SCORE_THRESHOLD", async () => {
    const generateAnswer = vi.fn(() =>
      Effect.succeed(
        "De kantine wordt beheerd door de kantineverantwoordelijke." as
          | string
          | undefined,
      ),
    );

    const result = await Effect.runPromise(
      provideAllServices(
        handleSearch({ query: "wie regelt de kantine", limit: 5 }),
        {
          matches: [
            makeHit("kantine", LLM_SCORE_THRESHOLD),
            makeHit("bar", MIN_SCORE + 0.05),
          ],
          aiService: { generateAnswer },
        },
      ),
    );

    expect(result.answer).toBe(
      "De kantine wordt beheerd door de kantineverantwoordelijke.",
    );
    expect(generateAnswer).toHaveBeenCalledOnce();
    expect(generateAnswer).toHaveBeenCalledWith(
      "wie regelt de kantine",
      expect.stringContaining("kantine"),
    );
  });

  it("omits answer when top score < LLM_SCORE_THRESHOLD", async () => {
    const generateAnswer = vi.fn(() =>
      Effect.succeed("should not appear" as string | undefined),
    );

    const result = await Effect.runPromise(
      provideAllServices(handleSearch({ query: "vague question", limit: 5 }), {
        matches: [makeHit("low", LLM_SCORE_THRESHOLD - 1e-6)],
        aiService: { generateAnswer },
      }),
    );

    expect(result.answer).toBeUndefined();
    expect(generateAnswer).not.toHaveBeenCalled();
  });

  it("returns results without answer when AI fails", async () => {
    const generateAnswer = vi.fn(() =>
      Effect.fail(new AiAnswerError("AI timeout")),
    );

    const result = await Effect.runPromise(
      provideAllServices(handleSearch({ query: "kantine", limit: 5 }), {
        matches: [makeHit("kantine", LLM_SCORE_THRESHOLD)],
        aiService: { generateAnswer },
      }),
    );

    expect(result.results).toHaveLength(1);
    expect(result.answer).toBeUndefined();
    expect(generateAnswer).toHaveBeenCalledOnce();
  });
});
