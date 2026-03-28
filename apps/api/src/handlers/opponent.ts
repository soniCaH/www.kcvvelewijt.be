import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { PsdApi, OpponentHistory } from "@kcvv/api-contract";
import { FootbalistoService } from "../footbalisto/service";
import { shouldServeStale, type BffError } from "../footbalisto/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { withErrorMapping } from "./error-mapping";

const opponentHistoryCache = TypedKvCache(OpponentHistory);

export const getOpponentHistoryHandler = (
  teamId: number,
  clubId: number,
): Effect.Effect<
  OpponentHistory,
  BffError,
  FootbalistoService | KvCacheService | WorkerEnvTag
> => {
  const cacheKey = `opponent:team:${teamId}:club:${clubId}`;
  const fetchHistory = Effect.gen(function* () {
    const service = yield* FootbalistoService;
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
