import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  MatchesArray,
  MatchDetail,
  PlayerSeasonStats,
  type Match,
  type PlayerSeasonStats as PlayerSeasonStatsType,
} from "@kcvv/api-contract";
import { PsdService } from "../psd/service";
import { shouldServeStale, type BffError } from "../psd/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { withErrorMapping } from "./error-mapping";

const matchesCache = TypedKvCache(MatchesArray);
const matchDetailCache = TypedKvCache(MatchDetail);
const playerStatsCache = TypedKvCache(PlayerSeasonStats);

export const getMatchesByTeamHandler = (
  teamId: number,
): Effect.Effect<
  readonly Match[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `matches:team:${teamId}`;
  const fetchMatches = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getTeamMatches(teamId);
  });

  return matchesCache.getOrFetch(
    cacheKey,
    fetchMatches,
    TTL.MATCHES_TEAM,
    undefined,
    { shouldServeStale },
  );
};

export const getNextMatchesHandler = (): Effect.Effect<
  readonly Match[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = "matches:next";
  const fetchMatches = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getNextMatches();
  });

  return matchesCache.getOrFetch(
    cacheKey,
    fetchMatches,
    TTL.NEXT_MATCHES,
    undefined,
    { shouldServeStale },
  );
};

export const getMatchByIdHandler = (
  matchId: number,
): Effect.Effect<Match, BffError, PsdService> =>
  Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getMatchById(matchId);
  });

export const getMatchDetailHandler = (
  matchId: number,
): Effect.Effect<
  MatchDetail,
  BffError,
  PsdService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `match:detail:${matchId}`;
  const fetchDetail = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getMatchDetail(matchId);
  });

  // Finished ≥48h ago → 7 days (immutable). All other cases → 24h.
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  return matchDetailCache.getOrFetch(
    cacheKey,
    fetchDetail,
    (detail) => {
      const isFinished =
        detail.status === "finished" || detail.status === "forfeited";
      const isOldEnough =
        Date.now() - new Date(detail.date).getTime() >= FORTY_EIGHT_HOURS_MS;
      return isFinished && isOldEnough
        ? TTL.MATCH_DETAIL_PAST
        : TTL.MATCH_DETAIL_DEFAULT;
    },
    undefined,
    { shouldServeStale },
  );
};

export const getPlayerStatsHandler = (
  memberId: number,
): Effect.Effect<
  PlayerSeasonStatsType,
  BffError,
  PsdService | KvCacheService | WorkerEnvTag
> =>
  Effect.gen(function* () {
    const service = yield* PsdService;
    const seasonId = yield* service.getCurrentSeasonId();

    const fetchStats = service.getPlayerStats(memberId);

    const cacheKey = `stats:player:${memberId}:${seasonId}`;
    return yield* playerStatsCache.getOrFetch(
      cacheKey,
      fetchStats,
      TTL.PLAYER_STATS,
      undefined,
      {
        shouldServeStale,
      },
    );
  });

export const MatchesApiLive = HttpApiBuilder.group(
  PsdApi,
  "matches",
  (handlers) =>
    handlers
      .handle("getMatchesByTeam", ({ path: { teamId } }) =>
        withErrorMapping(getMatchesByTeamHandler(teamId)),
      )
      .handle("getNextMatches", () => withErrorMapping(getNextMatchesHandler()))
      .handle("getMatchById", ({ path: { matchId } }) =>
        withErrorMapping(getMatchByIdHandler(matchId)),
      )
      .handle("getMatchDetail", ({ path: { matchId } }) =>
        withErrorMapping(getMatchDetailHandler(matchId)),
      )
      .handle("getPlayerStats", ({ path: { memberId } }) =>
        withErrorMapping(getPlayerStatsHandler(memberId)),
      ),
);
