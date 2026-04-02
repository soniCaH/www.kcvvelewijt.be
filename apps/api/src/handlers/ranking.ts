import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, RankingArray, type RankingEntry } from "@kcvv/api-contract";
import { PsdService } from "../psd/service";
import {
  shouldServeStale,
  ResourceNotFoundError,
  type BffError,
} from "../psd/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { withErrorMapping } from "./error-mapping";

const rankingCache = TypedKvCache(RankingArray);

export const getRankingHandler = (
  teamId: number,
  logoCdnUrl: string,
): Effect.Effect<
  readonly RankingEntry[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `ranking:team:${teamId}`;
  const fetchRanking = Effect.gen(function* () {
    const service = yield* PsdService;
    const entries = yield* service.getRanking(teamId, logoCdnUrl);
    if (entries.length === 0) {
      return yield* new ResourceNotFoundError({
        message: "No ranking data found",
        resourceType: "ranking",
        resourceId: teamId,
      });
    }
    return entries;
  });

  return rankingCache.getOrFetch(
    cacheKey,
    fetchRanking,
    TTL.RANKING,
    undefined,
    {
      shouldServeStale,
    },
  );
};

export const RankingApiLive = HttpApiBuilder.group(
  PsdApi,
  "ranking",
  (handlers) =>
    handlers.handle("getRanking", ({ path: { teamId } }) =>
      withErrorMapping(
        Effect.gen(function* () {
          const env = yield* WorkerEnvTag;
          return yield* getRankingHandler(teamId, env.FOOTBALISTO_LOGO_CDN_URL);
        }),
      ),
    ),
);
