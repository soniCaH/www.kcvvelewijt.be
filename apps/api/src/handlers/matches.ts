import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  MatchesArray,
  MatchDetail,
  type Match,
} from "@kcvv/api-contract";
import {
  FootbalistoService,
  FootbalistoServiceError,
} from "../footbalisto/service";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";

const matchesCache = TypedKvCache(MatchesArray);
const matchDetailCache = TypedKvCache(MatchDetail);

export const getMatchesByTeamHandler = (
  teamId: number,
): Effect.Effect<
  readonly Match[],
  FootbalistoServiceError,
  FootbalistoService | KvCacheService
> => {
  const cacheKey = `matches:team:${teamId}`;
  const fetchMatches = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getTeamMatches(teamId);
  });

  return matchesCache.getOrFetch(cacheKey, fetchMatches, TTL.MATCHES_TEAM);
};

export const getNextMatchesHandler = (): Effect.Effect<
  readonly Match[],
  FootbalistoServiceError,
  FootbalistoService | KvCacheService
> => {
  const cacheKey = "matches:next";
  const fetchMatches = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getNextMatches();
  });

  return matchesCache.getOrFetch(cacheKey, fetchMatches, TTL.NEXT_MATCHES);
};

export const getMatchByIdHandler = (
  matchId: number,
): Effect.Effect<Match, FootbalistoServiceError, FootbalistoService> =>
  Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getMatchById(matchId);
  });

export const getMatchDetailHandler = (
  matchId: number,
): Effect.Effect<
  MatchDetail,
  FootbalistoServiceError,
  FootbalistoService | KvCacheService
> => {
  const cacheKey = `match:detail:${matchId}`;
  const fetchDetail = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getMatchDetail(matchId);
  });

  // Finished and forfeited matches are immutable — cache 7 days.
  // Postponed/stopped may be rescheduled; scheduled = upcoming. Cache 60s.
  return matchDetailCache.getOrFetch(cacheKey, fetchDetail, (detail) =>
    detail.status === "finished" || detail.status === "forfeited"
      ? TTL.MATCH_DETAIL_PAST
      : TTL.MATCH_DETAIL_LIVE,
  );
};

export const MatchesApiLive = HttpApiBuilder.group(
  PsdApi,
  "matches",
  (handlers) =>
    handlers
      .handle("getMatchesByTeam", ({ path: { teamId } }) =>
        getMatchesByTeamHandler(teamId).pipe(Effect.orDie),
      )
      .handle("getNextMatches", () =>
        getNextMatchesHandler().pipe(Effect.orDie),
      )
      .handle("getMatchById", ({ path: { matchId } }) =>
        getMatchByIdHandler(matchId).pipe(Effect.orDie),
      )
      .handle("getMatchDetail", ({ path: { matchId } }) =>
        getMatchDetailHandler(matchId).pipe(Effect.orDie),
      ),
);
