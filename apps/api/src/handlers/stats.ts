import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  TeamStats,
  type TeamStats as TeamStatsType,
} from "@kcvv/api-contract";
import {
  FootbalistoClient,
  type FootbalistoClientError,
} from "../footbalisto/client";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { transformPsdTeamStats } from "../footbalisto/transforms";

const teamStatsCache = TypedKvCache(TeamStats);

export const getTeamStatsHandler = (
  teamId: number,
): Effect.Effect<
  TeamStatsType,
  FootbalistoClientError,
  FootbalistoClient | KvCacheService
> => {
  const cacheKey = `stats:team:${teamId}`;
  const fetchStats = Effect.gen(function* () {
    const client = yield* FootbalistoClient;
    const rawStats = yield* client.getRawTeamStats(teamId);
    return transformPsdTeamStats(teamId, rawStats);
  });

  return teamStatsCache.getOrFetch(cacheKey, fetchStats, TTL.STATS);
};

export const StatsApiLive = HttpApiBuilder.group(PsdApi, "stats", (handlers) =>
  handlers.handle("getTeamStats", ({ path: { teamId } }) =>
    getTeamStatsHandler(teamId).pipe(Effect.orDie),
  ),
);
