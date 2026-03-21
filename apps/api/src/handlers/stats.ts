import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  TeamStats,
  type TeamStats as TeamStatsType,
} from "@kcvv/api-contract";
import { FootbalistoService } from "../footbalisto/service";
import { shouldServeStale, type BffError } from "../footbalisto/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { withErrorMapping } from "./error-mapping";

const teamStatsCache = TypedKvCache(TeamStats);

export const getTeamStatsHandler = (
  teamId: number,
): Effect.Effect<
  TeamStatsType,
  BffError,
  FootbalistoService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `stats:team:${teamId}`;
  const fetchStats = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getTeamStats(teamId);
  });

  return teamStatsCache.getOrFetch(cacheKey, fetchStats, TTL.STATS, undefined, {
    shouldServeStale,
  });
};

export const StatsApiLive = HttpApiBuilder.group(PsdApi, "stats", (handlers) =>
  handlers.handle("getTeamStats", ({ path: { teamId } }) =>
    withErrorMapping(getTeamStatsHandler(teamId)),
  ),
);
