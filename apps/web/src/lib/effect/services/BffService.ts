import { Context, Effect, Layer, type Cause } from "effect";
import { HttpApiClient, FetchHttpClient } from "@effect/platform";
import type { HttpApiError, HttpClientError } from "@effect/platform";
import type { ParseError } from "effect/ParseResult";
import {
  PsdApi,
  type Match,
  type MatchDetail,
  type RankingTable,
  type HttpServiceUnavailable,
  type HttpBadGateway,
  type HttpNotFound,
  type OpponentHistory,
  type PlayerSeasonStats,
  type RelatedItem,
} from "@kcvv/api-contract";
import { guardDeclaredErrorBody } from "@/lib/effect/guard-declared-error-body";

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
    ) => Effect.Effect<readonly RankingTable[], BffError>;
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

/**
 * One `Effect.all` concurrency for every per-team BFF fan-out (`/kalender`,
 * `/scheurkalender`, `sitemap.ts`, `calendar.ics`). Production Sanity returns
 * 17 teams with a psdId, so this clears the real list in a single wave — the
 * old value of 5 cost four sequential waves per visitor, which only went
 * unnoticed while a TTL sat in front of these reads (#2389, #2441).
 *
 * Deliberately a ceiling rather than `"unbounded"`: the BFF owns rate limiting
 * and single-flight (#2328), so the client does not need to throttle, but a
 * bound keeps an unexpectedly long team list from bursting arbitrarily wide.
 */
export const BFF_FAN_OUT_CONCURRENCY = 20;

/**
 * This service adds no cache of its own — do not put one back (#2389). The BFF
 * owns freshness (#2326) and rate limiting + single-flight (#2328), so a second
 * TTL here bought nothing and actively froze: `unstable_cache`'s
 * stale-while-revalidate schedules its refresh on the serving instance, which a
 * dynamic route tears down as soon as the response is sent. Under this site's
 * one-visitor-at-a-time traffic that refresh never landed and `/wedstrijd/<id>`
 * served a pre-result payload for 10 h.
 *
 * Route-level ISR (`export const revalidate`) is a separate layer and stays —
 * Vercel drives those regenerations platform-side, so they do converge.
 * `apps/web/src/app/api/calendar.ics/route.ts` still wraps its reads in
 * `unstable_cache`; that one is not covered here.
 */
export const BffServiceLive = Layer.effect(
  BffService,
  Effect.gen(function* () {
    const bffUrl = process.env.KCVV_API_URL?.trim();
    if (!bffUrl)
      throw new Error(
        "KCVV_API_URL is not set — add it to .env.local before starting the app",
      );
    const client = yield* HttpApiClient.make(PsdApi, {
      baseUrl: bffUrl,
      // #2924: a declared-error-status response whose body isn't this BFF's
      // own error shape (a stale/misconfigured worker) must classify as
      // transient, not decode-fail into a permanent ParseError. See
      // guard-declared-error-body.ts for the full reasoning.
      transformClient: guardDeclaredErrorBody,
    });
    return {
      getMatches: (teamId: number) =>
        client.matches
          .getMatchesByTeam({ path: { teamId } })
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      getNextMatches: () =>
        client.matches.getNextMatches({}).pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      getMatchesWindow: () =>
        client.matches
          .getMatchesWindow({})
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      getMatchDetail: (matchId: number) =>
        client.matches
          .getMatchDetail({ path: { matchId } })
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      getRanking: (teamId: number) =>
        client.ranking
          .getRanking({ path: { teamId } })
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
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
