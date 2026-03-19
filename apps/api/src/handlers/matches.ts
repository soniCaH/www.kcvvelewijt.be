import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  MatchesArray,
  MatchDetail,
  type Match,
} from "@kcvv/api-contract";
import { FootbalistoService } from "../footbalisto/service";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";

const matchesCache = TypedKvCache(MatchesArray);
const matchDetailCache = TypedKvCache(MatchDetail);

export const getMatchesByTeamHandler = (
  teamId: number,
): Effect.Effect<
  readonly Match[],
  never,
  FootbalistoService | KvCacheService
> => {
  const cacheKey = `matches:team:${teamId}`;
  const fetchMatches = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getTeamMatches(teamId);
  });

  return matchesCache
    .getOrFetch(cacheKey, fetchMatches, TTL.MATCHES_TEAM)
    .pipe(Effect.orDie);
};

export const getNextMatchesHandler = (): Effect.Effect<
  readonly Match[],
  never,
  FootbalistoService | KvCacheService
> => {
  const cacheKey = "matches:next";
  const fetchMatches = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getNextMatches();
  });

  return matchesCache
    .getOrFetch(cacheKey, fetchMatches, TTL.NEXT_MATCHES)
    .pipe(Effect.orDie);
};

export const getMatchByIdHandler = (
  matchId: number,
): Effect.Effect<Match, never, FootbalistoService> =>
  Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getMatchById(matchId);
  }).pipe(Effect.orDie);

export const getMatchDetailHandler = (
  matchId: number,
): Effect.Effect<MatchDetail, never, FootbalistoService | KvCacheService> => {
  const cacheKey = `match:detail:${matchId}`;
  const fetchDetail = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getMatchDetail(matchId);
  });

  // Finished and forfeited matches are immutable — cache 7 days.
  // Postponed/stopped may be rescheduled; scheduled = upcoming. Cache 60s.
  return matchDetailCache
    .getOrFetch(cacheKey, fetchDetail, (detail) =>
      detail.status === "finished" || detail.status === "forfeited"
        ? TTL.MATCH_DETAIL_PAST
        : TTL.MATCH_DETAIL_LIVE,
    )
    .pipe(Effect.orDie);
};

export const MatchesApiLive = HttpApiBuilder.group(
  PsdApi,
  "matches",
  (handlers) =>
    handlers
      .handle("getMatchesByTeam", ({ path: { teamId } }) =>
        getMatchesByTeamHandler(teamId),
      )
      .handle("getNextMatches", () => getNextMatchesHandler())
      .handle("getMatchById", ({ path: { matchId } }) =>
        getMatchByIdHandler(matchId),
      )
      .handle("getMatchDetail", ({ path: { matchId } }) =>
        getMatchDetailHandler(matchId),
      ),
);
