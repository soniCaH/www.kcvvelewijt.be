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
  // "No table" is an answer, not a failure — remember it (#3059). Raised
  // inside the cache, it was never stored, so every team without a table
  // (onderbouw/middenbouw, U19) reached PSD on every read; once the daily
  // quota ran out those reads 503'd and took their pages down while every
  // team with a table kept serving its cached copy.
  //
  // A key of its own, never `[]` in `cacheKey`: a table that is already
  // cached must survive a refresh that briefly answers empty or 404, so the
  // note is written only when `cacheKey` holds nothing. A PSD 404 lands here
  // too: both already left this handler as the same 404. Cost: a youth table
  // that gets published shows up to one `TTL.RANKING` later, and a glitch on
  // a cold key (no read for the 7-day hard TTL) hides a real table as long.
  // Accepted: fewer PSD calls is the whole point of this note.
  const noTableKey = `ranking:none:team:${teamId}`;
  const noTable = new ResourceNotFoundError({
    message: "No ranking data found",
    resourceType: "ranking",
    resourceId: teamId,
  });

  const fetchRanking = Effect.gen(function* () {
    const service = yield* PsdService;
    const tables = yield* service.getRanking(teamId);
    if (tables.length === 0) return yield* noTable;
    return tables;
  });

  return Effect.gen(function* () {
    const kv = yield* KvCacheService;
    if ((yield* kv.get(noTableKey)) !== null) return yield* noTable;
    return yield* rankingCache
      .getOrFetch(cacheKey, fetchRanking, TTL.RANKING, undefined, {
        shouldServeStale,
      })
      .pipe(
        Effect.tapErrorTag("ResourceNotFound", () =>
          Effect.flatMap(kv.get(cacheKey), (table) =>
            table === null ? kv.set(noTableKey, "1", TTL.RANKING) : Effect.void,
          ),
        ),
      );
  });
};

export const RankingApiLive = HttpApiBuilder.group(
  PsdApi,
  "ranking",
  (handlers) =>
    handlers.handle("getRanking", ({ path: { teamId } }) =>
      withErrorMapping(getRankingHandler(teamId)),
    ),
);
