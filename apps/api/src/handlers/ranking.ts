import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, RankingArray, type RankingEntry } from "@kcvv/api-contract";
import { FootbalistoService } from "../footbalisto/service";
import { shouldServeStale, type BffError } from "../footbalisto/errors";
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
  FootbalistoService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `ranking:team:${teamId}`;
  const fetchRanking = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getRanking(teamId, logoCdnUrl);
  });

  return rankingCache.getOrFetch(
    cacheKey,
    fetchRanking,
    TTL.RANKING,
    undefined,
    { shouldServeStale },
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
