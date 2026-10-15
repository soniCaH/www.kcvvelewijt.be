import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  HttpServiceUnavailable,
  PsdApi,
  RelatedItem,
} from "@kcvv/api-contract";
import { Schema as S } from "effect";
import { handleRelated, NoRelatedItems } from "../search/related-handler";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { VectorizeService } from "../search/vectorize";
import { WorkerEnvTag } from "../env";
import { PsdGateService } from "../psd/gate";

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 5; // upper bound from S.between(1, 5) in api-contract

// `fetch` needs VectorizeService, not PsdService — its outcome must never
// speak for PSD health (`TypedKvCache`'s `psdBacked` option, #2868 review).
const relatedCache = TypedKvCache(S.Array(RelatedItem), { psdBacked: false });

export const getRelatedHandler = (request: {
  id: string;
  limit: number;
}): Effect.Effect<
  readonly (typeof RelatedItem.Type)[],
  HttpServiceUnavailable,
  VectorizeService | KvCacheService | WorkerEnvTag | PsdGateService
> => {
  const cacheKey = `related:${request.id}:max`;
  // An empty result is returned but never stored (#3468): storing it let any
  // made-up id buy a KV write, and hid a just-published article's related
  // items for the whole TTL. Failing the fetch keeps it out of KV.
  const fetchNonEmpty = handleRelated({
    id: request.id,
    limit: MAX_LIMIT,
  }).pipe(
    Effect.filterOrFail(
      (items) => items.length > 0,
      () => new NoRelatedItems(),
    ),
  );
  return relatedCache
    .getOrFetch(cacheKey, fetchNonEmpty, TTL.RELATED, undefined, {
      // "No related items" is an answer, not an outage: never keep stale for it.
      shouldServeStale: (error) => !(error instanceof NoRelatedItems),
    })
    .pipe(
      Effect.catchTag("NoRelatedItems", () => Effect.succeed([])),
      // Vectorize failing, a timed-out fetch or a spent budget: the declared
      // 503 (api-contract `related.ts`), not an `orDie` 500.
      Effect.tapError((error) =>
        Effect.logError(`[related] failed: ${error.message}`),
      ),
      Effect.mapError(
        () =>
          new HttpServiceUnavailable({ error: "Related service unavailable" }),
      ),
      Effect.map((items) => items.slice(0, request.limit)),
    );
};

export const RelatedApiLive = HttpApiBuilder.group(
  PsdApi,
  "related",
  (handlers) =>
    handlers.handle("getRelated", ({ urlParams }) =>
      getRelatedHandler({
        id: urlParams.id,
        limit: urlParams.limit ?? DEFAULT_LIMIT,
      }),
    ),
);
