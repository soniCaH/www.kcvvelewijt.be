import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, RankingArray, type RankingEntry } from "@kcvv/api-contract";
import {
  FootbalistoService,
  type FootbalistoServiceError,
} from "../footbalisto/service";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";

const rankingCache = TypedKvCache(RankingArray);

export const getRankingHandler = (
  teamId: number,
  logoCdnUrl: string,
): Effect.Effect<
  readonly RankingEntry[],
  FootbalistoServiceError,
  FootbalistoService | KvCacheService
> => {
  const cacheKey = `ranking:team:${teamId}`;
  const fetchRanking = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getRanking(teamId, logoCdnUrl);
  });

  return rankingCache.getOrFetch(cacheKey, fetchRanking, TTL.RANKING);
};

export const RankingApiLive = HttpApiBuilder.group(
  PsdApi,
  "ranking",
  (handlers) =>
    handlers.handle("getRanking", ({ path: { teamId } }) =>
      Effect.gen(function* () {
        const env = yield* WorkerEnvTag;
        return yield* getRankingHandler(teamId, env.FOOTBALISTO_LOGO_CDN_URL);
      }).pipe(Effect.orDie),
    ),
);
