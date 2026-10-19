import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, OpponentHistory } from "@kcvv/api-contract";
import { PsdService, isPartialFanout } from "../psd/service";
import { shouldServeStale, type BffError } from "../psd/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { PsdGateService } from "../psd/gate";
import { withErrorMapping } from "./error-mapping";
import { CACHE_VERSION } from "./matches";
import { kickoffMs } from "../psd/wall-clock";

const opponentHistoryCache = TypedKvCache(OpponentHistory);

// #2491: `transformPsdGame` gained a `venue` field — see the matching
// `CACHE_VERSION` comment in `handlers/matches.ts`. A cached pre-#2491
// entry under the old key would keep every opponent-history match venue-
// less for up to `TTL.OPPONENT_HISTORY * 2` (the stale-serve window) after
// this deploys. Versioned with every match cache key — see
// `CACHE_VERSION` in `handlers/matches.ts`.

/**
 * Soft cache TTL (seconds) for one squad's history against one opponent.
 *
 * The flat 7-day TTL pinned a pre-kickoff snapshot: Erpe-Mere's page still
 * showed the 18 Oct match as "Gepland" the morning after a 0–5 loss
 * (2026-10-19). While a match is past kickoff but still "scheduled" (PSD has
 * no score yet), refresh at matchday cadence, like `teamMatchesTtl`. The
 * window is the TTL itself, not 48h: a page nobody opened for two days must
 * still catch the result on its next read.
 */
export function opponentHistoryTtl(
  history: OpponentHistory,
  now: number = Date.now(),
): number {
  const resultPending = history.matches.some((m) => {
    const kickoff = kickoffMs(m.date);
    return (
      m.status === "scheduled" &&
      now > kickoff &&
      now - kickoff < TTL.OPPONENT_HISTORY * 1000
    );
  });
  return resultPending ? TTL.MATCH_DETAIL_MATCHDAY : TTL.OPPONENT_HISTORY;
}

export const getOpponentHistoryHandler = (
  teamId: number,
  clubId: number,
): Effect.Effect<
  OpponentHistory,
  BffError,
  PsdService | KvCacheService | WorkerEnvTag | PsdGateService
> => {
  const cacheKey = `opponent:team:${CACHE_VERSION}:${teamId}:club:${clubId}`;
  const fetchHistory = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getOpponentHistory(teamId, clubId);
  });

  return opponentHistoryCache.getOrFetch(
    cacheKey,
    fetchHistory,
    (history) => opponentHistoryTtl(history),
    TTL.OPPONENT_HISTORY * 2,
    { shouldServeStale, isPartial: isPartialFanout },
  );
};

export const OpponentApiLive = HttpApiBuilder.group(
  PsdApi,
  "opponent",
  (handlers) =>
    handlers.handle("getOpponentHistory", ({ path: { teamId, clubId } }) =>
      withErrorMapping(getOpponentHistoryHandler(teamId, clubId)),
    ),
);
