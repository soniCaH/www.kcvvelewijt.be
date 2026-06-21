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

export const getMatchesWindowHandler = (): Effect.Effect<
  readonly Match[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = "matches:window";
  const fetchMatches = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getMatchesWindow();
  });

  return matchesCache.getOrFetch(
    cacheKey,
    fetchMatches,
    TTL.MATCHES_WINDOW,
    undefined,
    { shouldServeStale },
  );
};

const HOUR_MS = 60 * 60 * 1000;

/**
 * Soft cache TTL (seconds) for a match-detail response, derived from kickoff
 * proximity. The rate-limited PSD hop is then refreshed often only when it
 * matters (live / matchday) and rarely for distant or settled matches.
 *
 *   finished ≥48h ago → 7d   (immutable)
 *   |kickoff − now| < 3h → 60s   (live)
 *                   < 24h → 300s  (matchday)
 *                   < 7d  → 3600s (this week)
 *   else              → 24h  (distant)
 */
export function matchDetailTtl(
  date: Date,
  status: string,
  now: number = Date.now(),
): number {
  const kickoff = new Date(date).getTime();
  const finished = status === "finished" || status === "forfeited";

  if (finished && now - kickoff >= 48 * HOUR_MS) return TTL.MATCH_DETAIL_PAST;

  const distanceMs = Math.abs(kickoff - now);
  if (distanceMs < 3 * HOUR_MS) return TTL.MATCH_DETAIL_LIVE;
  if (distanceMs < 24 * HOUR_MS) return TTL.MATCH_DETAIL_MATCHDAY;
  if (distanceMs < 7 * 24 * HOUR_MS) return TTL.MATCH_DETAIL_WEEK;
  return TTL.MATCH_DETAIL_DEFAULT;
}

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

  return matchDetailCache.getOrFetch(
    cacheKey,
    fetchDetail,
    (detail) => matchDetailTtl(detail.date, detail.status),
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
      .handle("getMatchesWindow", () =>
        withErrorMapping(getMatchesWindowHandler()),
      )
      .handle("getMatchDetail", ({ path: { matchId } }) =>
        withErrorMapping(getMatchDetailHandler(matchId)),
      )
      .handle("getPlayerStats", ({ path: { memberId } }) =>
        withErrorMapping(getPlayerStatsHandler(memberId)),
      ),
);
