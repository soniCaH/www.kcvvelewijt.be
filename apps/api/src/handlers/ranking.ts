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
import {
  HARD_TTL_DEFAULT,
  KvCacheService,
  TTL,
  TypedKvCache,
} from "../cache/kv-cache";
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

  // The note holds when it was written and stays in KV for the 7-day hard
  // TTL, like any cached value: fresh for `TTL.RANKING`, stale after. A stale
  // note sends the read back to PSD, but if PSD is down it still answers —
  // "stale is the floor" (#2321) — so an expired note on a day the quota is
  // spent cannot take the page down again.
  return Effect.gen(function* () {
    const kv = yield* KvCacheService;
    const notedAt = Number((yield* kv.get(noTableKey)) ?? NaN);
    if (Date.now() - notedAt < TTL.RANKING * 1000) return yield* noTable;
    return yield* rankingCache
      .getOrFetch(cacheKey, fetchRanking, TTL.RANKING, undefined, {
        shouldServeStale,
      })
      .pipe(
        Effect.tapErrorTag("ResourceNotFound", () =>
          Effect.flatMap(kv.get(cacheKey), (table) =>
            table === null
              ? kv.set(noTableKey, String(Date.now()), HARD_TTL_DEFAULT)
              : Effect.void,
          ),
        ),
        Effect.catchIf(
          (error) => !Number.isNaN(notedAt) && shouldServeStale(error),
          () => Effect.fail(noTable),
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
