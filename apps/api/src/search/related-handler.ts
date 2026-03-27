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
      .filter((m) => m.metadata?.["type"] !== "responsibility")
      .slice(0, request.limit)
      .map((m) => {
        const rawType = m.metadata?.["type"];
        const type: "article" | "page" =
          typeof rawType === "string" &&
          (rawType === "article" || rawType === "page")
            ? rawType
            : "page";
        const rawTitle = m.metadata?.["title"];
        const title = typeof rawTitle === "string" ? rawTitle : "";
        const rawExcerpt = m.metadata?.["excerpt"];
        const excerpt = typeof rawExcerpt === "string" ? rawExcerpt : "";
        return {
          id: m.id,
          slug: m.metadata?.["slug"] ?? "",
          type,
          score: m.score,
          title,
          excerpt,
          imageUrl: m.metadata?.["imageUrl"] ?? null,
        };
      });
  });
