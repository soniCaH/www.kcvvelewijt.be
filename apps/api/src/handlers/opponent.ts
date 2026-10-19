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
const HOUR_MS = 60 * 60 * 1000;

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
 * no score yet), refresh at matchday cadence for 48 h, like
 * `teamMatchesTtl`; then daily until the 7-day TTL. A refresh is a whole
 * season fan-out, so a match PSD never scores must not cost one every 15 min
 * for a week, yet a page nobody opened for two days still catches its result.
 */
export function opponentHistoryTtl(
  history: OpponentHistory,
  now: number = Date.now(),
): number {
  const pendingFor = history.matches
    .filter((m) => m.status === "scheduled" && kickoffMs(m.date) < now)
    .map((m) => now - kickoffMs(m.date));
  if (pendingFor.some((ms) => ms < 48 * HOUR_MS)) {
    return TTL.MATCH_DETAIL_MATCHDAY;
  }
  if (pendingFor.some((ms) => ms < TTL.OPPONENT_HISTORY * 1000)) {
    return TTL.MATCHES_TEAM;
  }
  return TTL.OPPONENT_HISTORY;
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
    {
      shouldServeStale,
      isPartial: isPartialFanout,
      // A stale copy with a played match still "Gepland" is the wrong
      // answer, and ISR would freeze it into the page for 15 min: fetch now.
      refreshInline: (history) =>
        opponentHistoryTtl(history) !== TTL.OPPONENT_HISTORY,
    },
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
