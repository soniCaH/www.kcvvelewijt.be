import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, OpponentHistory } from "@kcvv/api-contract";
import { PsdService } from "../psd/service";
import { shouldServeStale, type BffError } from "../psd/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { PsdGateService } from "../psd/gate";
import { withErrorMapping } from "./error-mapping";

const opponentHistoryCache = TypedKvCache(OpponentHistory);

// #2491: `transformPsdGame` gained a `venue` field — see the matching
// `CACHE_VERSION` comment in `handlers/matches.ts`. A cached pre-#2491
// entry under the old key would keep every opponent-history match venue-
// less for up to `TTL.OPPONENT_HISTORY * 2` (the stale-serve window) after
// this deploys.
const CACHE_VERSION = "v2";

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
    TTL.OPPONENT_HISTORY,
    TTL.OPPONENT_HISTORY * 2,
    { shouldServeStale },
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
