import { Effect } from "effect";
import type { SearchRequest, SearchResponse } from "@kcvv/api-contract";
import { EmbeddingService } from "./embedding";
import { VectorizeService } from "./vectorize";

const MIN_SCORE = 0.4;

const TYPE_FILTER: Record<string, string> = {
  responsibility: "responsibilityPath",
  article: "article",
  general: "page",
};

export const handleSearch = (
  request: typeof SearchRequest.Type,
): Effect.Effect<
  typeof SearchResponse.Type,
  never,
  EmbeddingService | VectorizeService
> =>
  Effect.gen(function* () {
    const embedding = yield* EmbeddingService;
    const vectorize = yield* VectorizeService;

    const vector = yield* embedding.embed(request.query).pipe(Effect.orDie);

    const filter = request.type
      ? { type: TYPE_FILTER[request.type] ?? request.type }
      : undefined;

    const matches = yield* vectorize
      .query(vector, {
        topK: request.limit,
        returnMetadata: "all",
        ...(filter ? { filter } : {}),
      })
      .pipe(Effect.orDie);

    const results = matches
      .filter((m) => m.score >= MIN_SCORE)
      .map((m) => ({
        id: m.id,
        slug: m.metadata?.["slug"] ?? "",
        type: (m.metadata?.["type"] ?? "responsibilityPath") as
          | "responsibilityPath"
          | "article"
          | "page",
        score: m.score,
        title: m.metadata?.["title"] ?? "",
        excerpt: m.metadata?.["excerpt"] ?? "",
      }));

    return { results };
  });
