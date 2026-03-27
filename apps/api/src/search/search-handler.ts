import { Effect } from "effect";
import type { SearchRequest, SearchResponse } from "@kcvv/api-contract";
import { EmbeddingService, type EmbeddingError } from "./embedding";
import { VectorizeService, type VectorizeError } from "./vectorize";
import { AiAnswerService } from "./ai-answer";

export const MIN_SCORE = 0.35;
export const LLM_SCORE_THRESHOLD = 0.5;

export type SearchError = EmbeddingError | VectorizeError;

const TYPE_FILTER: Record<string, string> = {
  responsibility: "responsibility",
  article: "article",
  general: "page",
};

export const handleSearch = (
  request: typeof SearchRequest.Type,
): Effect.Effect<
  typeof SearchResponse.Type,
  SearchError,
  EmbeddingService | VectorizeService | AiAnswerService
> =>
  Effect.gen(function* () {
    const embedding = yield* EmbeddingService;
    const vectorize = yield* VectorizeService;
    const aiAnswer = yield* AiAnswerService;

    const vector = yield* embedding.embed(request.query);

    const filter = request.type
      ? { type: TYPE_FILTER[request.type] ?? request.type }
      : undefined;

    const matches = yield* vectorize.query(vector, {
      topK: request.limit,
      returnMetadata: "all",
      ...(filter ? { filter } : {}),
    });

    const results = matches
      .filter((m) => m.score >= MIN_SCORE)
      .map((m) => ({
        id: m.id,
        slug: m.metadata?.["slug"] ?? "",
        type: (m.metadata?.["type"] ?? "responsibility") as
          | "responsibility"
          | "article"
          | "page",
        score: m.score,
        title: m.metadata?.["title"] ?? "",
        excerpt: m.metadata?.["excerpt"] ?? "",
      }));

    const topScore = results[0]?.score ?? 0;
    let answer: string | undefined;

    if (topScore >= LLM_SCORE_THRESHOLD) {
      const context = results
        .slice(0, 3)
        .map((r, i) => `${i + 1}. ${r.title}: ${r.excerpt}`)
        .join("\n");

      answer = yield* aiAnswer
        .generateAnswer(request.query, context)
        .pipe(Effect.catchAll(() => Effect.succeed(undefined)));
    }

    return { results, ...(answer ? { answer } : {}) };
  });
