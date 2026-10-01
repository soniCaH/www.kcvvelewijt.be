import { Effect } from "effect";
import { SearchResultType } from "@kcvv/api-contract";
import type { SearchRequest, SearchResponse } from "@kcvv/api-contract";
import { EmbeddingService, type EmbeddingError } from "./embedding";
import { VectorizeService, type VectorizeError } from "./vectorize";
import { AiAnswerService } from "./ai-answer";

export const MIN_SCORE = 0.35;
export const LLM_SCORE_THRESHOLD = 0.5;

export type SearchError = EmbeddingError | VectorizeError;

/**
 * The types the response contract admits. Vectorize outlives the schema: a
 * retired type's vectors stay until something names them, and one of those
 * rows fails the entire SearchResponse. Drop the row, keep the search.
 *
 * A row with no `type` at all is dropped too — the metadata is the only writer
 * of that slot, so an absent one has no value to stand in for it.
 */
const RESULT_TYPES = new Set<string>(SearchResultType.literals);

const isResultType = (
  value: string | undefined,
): value is typeof SearchResultType.Type =>
  value !== undefined && RESULT_TYPES.has(value);

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

    // Over-fetch, then slice: the index holds types this response does not
    // admit (galleries, #3338), and `isResultType` drops them AFTER topK, so
    // asking for exactly `limit` would let them eat the limit. 20 is
    // Vectorize's topK ceiling with `returnMetadata: "all"`.
    const matches = yield* vectorize.query(vector, {
      topK: Math.min(request.limit * 2, 20),
      returnMetadata: "all",
      ...(filter ? { filter } : {}),
    });

    const results = matches
      .flatMap((m) => {
        const type = m.metadata?.["type"];
        if (m.score < MIN_SCORE || !isResultType(type)) return [];

        return [
          {
            id: m.id,
            slug: m.metadata?.["slug"] ?? "",
            type,
            score: m.score,
            title: m.metadata?.["title"] ?? "",
            excerpt: m.metadata?.["excerpt"] ?? "",
          },
        ];
      })
      .slice(0, request.limit);

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
