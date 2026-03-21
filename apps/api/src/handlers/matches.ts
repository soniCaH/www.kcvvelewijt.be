import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  MatchesArray,
  MatchDetail,
  type Match,
} from "@kcvv/api-contract";
import { FootbalistoService } from "../footbalisto/service";
import { shouldServeStale, type BffError } from "../footbalisto/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { withErrorMapping } from "./error-mapping";

const matchesCache = TypedKvCache(MatchesArray);
const matchDetailCache = TypedKvCache(MatchDetail);

export const getMatchesByTeamHandler = (
  teamId: number,
): Effect.Effect<
  readonly Match[],
  BffError,
  FootbalistoService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `matches:team:${teamId}`;
  const fetchMatches = Effect.gen(function* () {
    const service = yield* FootbalistoService;
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
  FootbalistoService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = "matches:next";
  const fetchMatches = Effect.gen(function* () {
    const service = yield* FootbalistoService;
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
): Effect.Effect<Match, BffError, FootbalistoService> =>
  Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getMatchById(matchId);
  });

export const getMatchDetailHandler = (
  matchId: number,
): Effect.Effect<
  MatchDetail,
  BffError,
  FootbalistoService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `match:detail:${matchId}`;
  const fetchDetail = Effect.gen(function* () {
    const service = yield* FootbalistoService;
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
      ),
);
