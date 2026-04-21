import { Effect } from "effect";
import type { RelatedItem } from "@kcvv/api-contract";
import { VectorizeService } from "./vectorize";

/**
 * The Cloudflare Vectorize `query` binding only returns *indexed* metadata
 * fields on matches, even when `returnMetadata: "all"` is set. Non-indexed
 * fields (notably `imageUrl` and `excerpt`) come back undefined. `getByIds`
 * preserves all stored metadata — so we query for IDs+scores, then look the
 * metadata up via getByIds. Two round trips, but the wire payload stays
 * consistent regardless of which metadata indexes exist on the index.
 */
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

    // Score is what query returns; fetch full metadata for the candidates.
    const scoreById = new Map(matches.map((m) => [m.id, m.score]));
    const candidateIds = matches
      .filter((m) => m.id !== request.id)
      .filter((m) => m.metadata?.["type"] !== "responsibility")
      .slice(0, request.limit)
      .map((m) => m.id);

    if (candidateIds.length === 0) return [];

    const enriched = yield* vectorize.getByIds(candidateIds).pipe(Effect.orDie);

    // Preserve the score-descending order from `matches`.
    const byId = new Map(enriched.map((r) => [r.id, r]));
    return candidateIds
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .map((r) => {
        const meta = r.metadata;
        const rawType = meta["type"];
        const type: "article" | "page" =
          rawType === "article" || rawType === "page" ? rawType : "page";
        return {
          id: r.id,
          slug: meta["slug"] ?? "",
          type,
          score: scoreById.get(r.id) ?? 0,
          title: meta["title"] ?? "",
          excerpt: meta["excerpt"] ?? "",
          imageUrl: meta["imageUrl"] ?? null,
        };
      });
  });
