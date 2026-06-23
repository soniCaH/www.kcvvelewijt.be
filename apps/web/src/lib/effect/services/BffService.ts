import { Cause, Context, Data, Effect, Exit, Layer, Schema as S } from "effect";
import { unstable_cache } from "next/cache";
import { HttpApiClient, FetchHttpClient } from "@effect/platform";
import type { HttpApiError, HttpClientError } from "@effect/platform";
import type { ParseError } from "effect/ParseResult";
import {
  PsdApi,
  Match,
  MatchDetail,
  RankingEntry,
  type HttpServiceUnavailable,
  type HttpBadGateway,
  type HttpNotFound,
  type OpponentHistory,
  type PlayerSeasonStats,
  type RelatedItem,
} from "@kcvv/api-contract";

export type BffError =
  | HttpClientError.HttpClientError
  | ParseError
  | HttpApiError.HttpApiDecodeError
  | Cause.TimeoutException
  | HttpServiceUnavailable
  | HttpBadGateway
  | HttpNotFound;

export class BffService extends Context.Tag("BffService")<
  BffService,
  {
    getMatches: (teamId: number) => Effect.Effect<readonly Match[], BffError>;
    getNextMatches: () => Effect.Effect<readonly Match[], BffError>;
    getMatchesWindow: () => Effect.Effect<readonly Match[], BffError>;
    getMatchDetail: (matchId: number) => Effect.Effect<MatchDetail, BffError>;
    getRanking: (
      teamId: number,
    ) => Effect.Effect<readonly RankingEntry[], BffError>;
    getRelated: (
      id: string,
      limit?: number,
    ) => Effect.Effect<readonly RelatedItem[], BffError>;
    getOpponentHistory: (
      teamId: number,
      clubId: number,
    ) => Effect.Effect<OpponentHistory, BffError>;
    getPlayerStats: (
      memberId: number,
    ) => Effect.Effect<PlayerSeasonStats, BffError>;
  }
>() {}

const DEFAULT_TIMEOUT = "30 seconds";

// Hot-read cache windows. Fixtures/results shift around match days; standings
// move ~weekly. Tunable — paired with `tags` so a future PSD-sync webhook can
// `revalidateTag(...)` on write instead of waiting out the TTL.
const MATCHES_REVALIDATE = 300; // 5 min
const RANKING_REVALIDATE = 3600; // 1 h

const MatchArray = S.Array(Match);
const RankingArray = S.Array(RankingEntry);

/**
 * Internal carrier that ferries a failed effect's original `Cause` across the
 * `unstable_cache` Promise boundary. Thrown inside the cache fn (so failures are
 * never cached) and unwrapped right after the boundary via `Effect.failCause`,
 * so the original TYPED error survives instead of flattening into an opaque
 * `FiberFailure`. Never escapes `cachedRead`.
 */
class CachedReadEffectFailure extends Data.TaggedError(
  "CachedReadEffectFailure",
)<{ readonly cause: Cause.Cause<BffError> }> {}

/**
 * Wrap a hot BFF read in Next's data cache. On a cache miss the client Effect
 * (R = never) is run inside `unstable_cache`; its decoded result is re-encoded to
 * a JSON-safe shape before storage, so `Date` fields (`Match.date`,
 * `RankingEntry.last_updated` — both `DateFromStringOrDate`) survive the cache's
 * JSON round-trip and decode back to `Date` on read.
 *
 * Failures are never cached and their TYPED error is preserved: the effect is run
 * with `runPromiseExit`, and on failure the `Cause` is carried out via
 * `CachedReadEffectFailure` and re-raised with `failCause` — so call sites that
 * `catchTag("HttpNotFound")` → `notFound()` (getMatches @
 * ploegen/[slug]/wedstrijden, getMatchDetail @ wedstrijd/[matchId]) still fire,
 * with NO extra BFF call on the error path. (#2213)
 */
function cachedRead<A, I>(
  schema: S.Schema<A, I>,
  keyParts: readonly string[],
  tags: readonly string[],
  revalidate: number,
  effect: Effect.Effect<A, BffError>,
): Effect.Effect<A, BffError> {
  const loadCached = unstable_cache(
    async (): Promise<I> => {
      // runPromiseExit captures a typed failure as a Cause instead of rejecting,
      // so the error type isn't lost crossing the Promise boundary.
      const exit = await Effect.runPromiseExit(effect);
      if (Exit.isSuccess(exit)) return S.encodeSync(schema)(exit.value);
      // Throw so unstable_cache never stores the failure; carry the Cause out.
      throw new CachedReadEffectFailure({ cause: exit.cause });
    },
    [...keyParts],
    { revalidate, tags: [...tags] },
  );
  return Effect.tryPromise({
    try: () => loadCached(),
    // The raw throw arrives as `unknown` here (pre-Effect boundary), so this one
    // check must stay `instanceof`. Anything other than our carrier (an
    // encode/infra throw) is genuinely unexpected → a defect.
    catch: (e) =>
      e instanceof CachedReadEffectFailure
        ? e
        : new CachedReadEffectFailure({ cause: Cause.die(e) }),
  }).pipe(
    Effect.flatMap((encoded) => S.decodeUnknown(schema)(encoded)),
    // Re-raise the original typed error from its Cause — no re-run. A decode
    // ParseError (already a BffError member) flows through untouched.
    Effect.catchTag("CachedReadEffectFailure", (e) =>
      Effect.failCause(e.cause),
    ),
  );
}

export const BffServiceLive = Layer.effect(
  BffService,
  Effect.gen(function* () {
    const bffUrl = process.env.KCVV_API_URL?.trim();
    if (!bffUrl)
      throw new Error(
        "KCVV_API_URL is not set — add it to .env.local before starting the app",
      );
    const client = yield* HttpApiClient.make(PsdApi, { baseUrl: bffUrl });
    return {
      getMatches: (teamId: number) =>
        cachedRead(
          MatchArray,
          ["bff", "matches", String(teamId)],
          ["bff:matches", `bff:matches:${teamId}`],
          MATCHES_REVALIDATE,
          client.matches
            .getMatchesByTeam({ path: { teamId } })
            .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
        ),
      getNextMatches: () =>
        cachedRead(
          MatchArray,
          ["bff", "next-matches"],
          ["bff:matches", "bff:next-matches"],
          MATCHES_REVALIDATE,
          client.matches
            .getNextMatches({})
            .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
        ),
      getMatchesWindow: () =>
        client.matches
          .getMatchesWindow({})
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      // Cached: results are pre/post only (no live in-progress scores), so the
      // pre→post transition is a one-time flip a 5-min TTL handles fine.
      // cachedRead's raw-effect fallback preserves the typed HttpNotFound that
      // wedstrijd/[matchId] turns into notFound() (#2213).
      getMatchDetail: (matchId: number) =>
        cachedRead(
          MatchDetail,
          ["bff", "match-detail", String(matchId)],
          ["bff:match-detail", `bff:match-detail:${matchId}`],
          MATCHES_REVALIDATE,
          client.matches
            .getMatchDetail({ path: { matchId } })
            .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
        ),
      getRanking: (teamId: number) =>
        cachedRead(
          RankingArray,
          ["bff", "ranking", String(teamId)],
          ["bff:ranking", `bff:ranking:${teamId}`],
          RANKING_REVALIDATE,
          client.ranking
            .getRanking({ path: { teamId } })
            .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
        ),
      getRelated: (id: string, limit?: number) =>
        client.related
          .getRelated({ urlParams: { id, limit } })
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      getOpponentHistory: (teamId: number, clubId: number) =>
        client.opponent
          .getOpponentHistory({ path: { teamId, clubId } })
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      getPlayerStats: (memberId: number) =>
        client.matches
          .getPlayerStats({ path: { memberId } })
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
    };
  }),
).pipe(Layer.provide(FetchHttpClient.layer));
