import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, RankingArray, type RankingEntry } from "@kcvv/api-contract";
import {
  FootbalistoClient,
  type FootbalistoClientError,
} from "../footbalisto/client";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { transformFootbalistoRankingEntry } from "../footbalisto/transforms";

const rankingCache = TypedKvCache(RankingArray);

export const getRankingHandler = (
  teamId: number,
  logoCdnUrl: string,
): Effect.Effect<
  readonly RankingEntry[],
  FootbalistoClientError,
  FootbalistoClient | KvCacheService
> => {
  const cacheKey = `ranking:team:${teamId}`;
  const fetchRanking = Effect.gen(function* () {
    const client = yield* FootbalistoClient;
    const competitions = yield* client.getRawRanking(teamId);

    const competition =
      competitions.find(
        (c) =>
          c.teams.length > 0 &&
          c.type.toUpperCase() !== "CUP" &&
          c.type.toUpperCase() !== "FRIENDLY",
      ) ?? competitions.find((c) => c.teams.length > 0);

    if (!competition || competition.teams.length === 0) {
      return [] as readonly RankingEntry[];
    }

    return competition.teams.map((e) =>
      transformFootbalistoRankingEntry(e, logoCdnUrl),
    );
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
