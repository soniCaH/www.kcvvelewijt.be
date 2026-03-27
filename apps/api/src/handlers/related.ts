import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, RelatedItem } from "@kcvv/api-contract";
import { Schema as S } from "effect";
import { handleRelated } from "../search/related-handler";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { VectorizeService } from "../search/vectorize";
import { WorkerEnvTag } from "../env";

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 5; // upper bound from S.between(1, 5) in api-contract

const relatedCache = TypedKvCache(S.Array(RelatedItem));

export const getRelatedHandler = (request: {
  id: string;
  limit: number;
}): Effect.Effect<
  readonly (typeof RelatedItem.Type)[],
  never,
  VectorizeService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `related:${request.id}:max`;
  return relatedCache
    .getOrFetch(
      cacheKey,
      handleRelated({ id: request.id, limit: MAX_LIMIT }),
      TTL.RELATED,
    )
    .pipe(Effect.map((items) => items.slice(0, request.limit)));
};

export const RelatedApiLive = HttpApiBuilder.group(
  PsdApi,
  "related",
  (handlers) =>
    handlers.handle("getRelated", ({ urlParams }) =>
      getRelatedHandler({
        id: urlParams.id,
        limit: urlParams.limit ?? DEFAULT_LIMIT,
      }).pipe(Effect.orDie),
    ),
);
