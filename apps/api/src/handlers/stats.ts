import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  TeamStats,
  type TeamStats as TeamStatsType,
} from "@kcvv/api-contract";
import {
  FootbalistoService,
  type FootbalistoServiceError,
} from "../footbalisto/service";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";

const teamStatsCache = TypedKvCache(TeamStats);

export const getTeamStatsHandler = (
  teamId: number,
): Effect.Effect<
  TeamStatsType,
  FootbalistoServiceError,
  FootbalistoService | KvCacheService
> => {
  const cacheKey = `stats:team:${teamId}`;
  const fetchStats = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getTeamStats(teamId);
  });

  return teamStatsCache.getOrFetch(cacheKey, fetchStats, TTL.STATS);
};

export const StatsApiLive = HttpApiBuilder.group(PsdApi, "stats", (handlers) =>
  handlers.handle("getTeamStats", ({ path: { teamId } }) =>
    getTeamStatsHandler(teamId).pipe(Effect.orDie),
  ),
);
