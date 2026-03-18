import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  MatchesArray,
  MatchDetail,
  type Match,
} from "@kcvv/api-contract";
import {
  FootbalistoClient,
  type FootbalistoClientError,
} from "../footbalisto/client";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import {
  transformPsdGame,
  transformFootbalistoMatchDetail,
  matchDetailToMatch,
} from "../footbalisto/transforms";

const matchesCache = TypedKvCache(MatchesArray);
const matchDetailCache = TypedKvCache(MatchDetail);

export const getMatchesByTeamHandler = (
  teamId: number,
): Effect.Effect<
  readonly Match[],
  FootbalistoClientError,
  FootbalistoClient | KvCacheService
> => {
  const cacheKey = `matches:team:${teamId}`;
  const fetchMatches = Effect.gen(function* () {
    const client = yield* FootbalistoClient;
    const rawMatches = yield* client.getRawMatches(teamId);
    return rawMatches.map(transformPsdGame);
  });

  return matchesCache.getOrFetch(cacheKey, fetchMatches, TTL.MATCHES_TEAM);
};

export const getNextMatchesHandler = (): Effect.Effect<
  readonly Match[],
  FootbalistoClientError,
  FootbalistoClient | KvCacheService
> => {
  const cacheKey = "matches:next";
  const fetchMatches = Effect.gen(function* () {
    const client = yield* FootbalistoClient;
    const rawMatches = yield* client.getRawNextMatches();
    // Filter out Weitse Gans (teamId 23) — not KCVV but plays on KCVV pitch
    return rawMatches.filter((m) => m.teamId !== 23).map(transformPsdGame);
  });

  return matchesCache.getOrFetch(cacheKey, fetchMatches, TTL.NEXT_MATCHES);
};

export const getMatchByIdHandler = (
  matchId: number,
): Effect.Effect<Match, FootbalistoClientError, FootbalistoClient> =>
  Effect.gen(function* () {
    const client = yield* FootbalistoClient;
    const rawDetail = yield* client.getRawMatchDetail(matchId);
    return matchDetailToMatch(transformFootbalistoMatchDetail(rawDetail));
  });

export const getMatchDetailHandler = (
  matchId: number,
): Effect.Effect<
  MatchDetail,
  FootbalistoClientError,
  FootbalistoClient | KvCacheService
> => {
  const cacheKey = `match:detail:${matchId}`;
  const fetchDetail = Effect.gen(function* () {
    const client = yield* FootbalistoClient;
    const rawDetail = yield* client.getRawMatchDetail(matchId);
    return transformFootbalistoMatchDetail(rawDetail);
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
