import { Effect } from "effect";
import type { RelatedItem } from "@kcvv/api-contract";
import { VectorizeService } from "./vectorize";

/**
 * The Cloudflare Vectorize `query` binding only returns *indexed* metadata
 * fields on matches, even when `returnMetadata: "all"` is set. Non-indexed
 * fields (notably `imageUrl` and `excerpt`) come back undefined. `getByIds`
 * preserves all stored metadata — so we query for IDs+scores, then look the
 * metadata up via getByIds.
 *
 * Filtering (responsibility neighbours, etc.) happens *post-hydration* so
 * that it reads from the authoritative stored metadata rather than the
 * truncated query-side view. That keeps the handler correct even if a
 * metadata index is dropped or its property name changes.
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

    // Preserve query-side score ordering; only drop the self match up front
    // (cheap id comparison, no metadata dependency).
    const scoreById = new Map(matches.map((m) => [m.id, m.score]));
    const candidateIds = matches
      .map((m) => m.id)
      .filter((id) => id !== request.id);

    if (candidateIds.length === 0) return [];

    const enriched = yield* vectorize.getByIds(candidateIds).pipe(Effect.orDie);
    const byId = new Map(enriched.map((r) => [r.id, r]));

    return candidateIds
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .filter((r) => r.metadata["type"] !== "responsibility")
      .slice(0, request.limit)
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
