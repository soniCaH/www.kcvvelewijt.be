import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  RankingTableArray,
  type RankingTable,
} from "@kcvv/api-contract";
import { PsdService } from "../psd/service";
import {
  shouldServeStale,
  ResourceNotFoundError,
  type BffError,
} from "../psd/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { PsdGateService } from "../psd/gate";
import { withErrorMapping } from "./error-mapping";

const rankingCache = TypedKvCache(RankingTableArray);

export const getRankingHandler = (
  teamId: number,
): Effect.Effect<
  readonly RankingTable[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag | PsdGateService
> => {
  const cacheKey = `ranking:team:${teamId}`;
  const fetchRanking = Effect.gen(function* () {
    const service = yield* PsdService;
    const tables = yield* service.getRanking(teamId);
    if (tables.length === 0) {
      return yield* new ResourceNotFoundError({
        message: "No ranking data found",
        resourceType: "ranking",
        resourceId: teamId,
      });
    }
    return tables;
  });

  return rankingCache.getOrFetch(
    cacheKey,
    fetchRanking,
    TTL.RANKING,
    undefined,
    {
      shouldServeStale,
    },
  );
};

export const RankingApiLive = HttpApiBuilder.group(
  PsdApi,
  "ranking",
  (handlers) =>
    handlers.handle("getRanking", ({ path: { teamId } }) =>
      withErrorMapping(getRankingHandler(teamId)),
    ),
);
