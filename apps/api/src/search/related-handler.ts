import { Effect } from "effect";
import type { RelatedItem } from "@kcvv/api-contract";
import { VectorizeService } from "./vectorize";

export const handleRelated = (request: {
  id: string;
  limit: number;
}): Effect.Effect<(typeof RelatedItem.Type)[], never, VectorizeService> =>
  Effect.gen(function* () {
    const vectorize = yield* VectorizeService;

    const stored = yield* vectorize.getByIds([request.id]).pipe(Effect.orDie);
    if (stored.length === 0) return [];

    const vector = stored[0]!.values;
    const matches = yield* vectorize
      .query(vector, { topK: request.limit * 3 + 1, returnMetadata: "all" })
      .pipe(Effect.orDie);

    return matches
      .filter((m) => m.id !== request.id)
      .filter((m) => m.metadata?.["type"] !== "responsibilityPath")
      .slice(0, request.limit)
      .map((m) => ({
        id: m.id,
        slug: m.metadata?.["slug"] ?? "",
        type: (m.metadata?.["type"] ?? "page") as "article" | "page",
        score: m.score,
        title: m.metadata?.["title"] ?? "",
        excerpt: m.metadata?.["excerpt"] ?? "",
        imageUrl: m.metadata?.["imageUrl"] || null,
      }));
  });
