import { Context, Effect, Layer, type Cause } from "effect";
import { HttpApiClient, FetchHttpClient } from "@effect/platform";
import type { HttpApiError, HttpClientError } from "@effect/platform";
import type { ParseError } from "effect/ParseResult";
import {
  PsdApi,
  type HttpServiceUnavailable,
  type HttpBadGateway,
  type HttpNotFound,
  type Match,
  type MatchDetail,
  type OpponentHistory,
  type PlayerSeasonStats,
  type RankingEntry,
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
    getMatchById: (matchId: number) => Effect.Effect<Match, BffError>;
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
        client.matches
          .getMatchesByTeam({ path: { teamId } })
          .pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      getNextMatches: () =>
        client.matches.getNextMatches({}).pipe(Effect.timeout(DEFAULT_TIMEOUT)),
      getMatchById: (matchId: number) =>
        client.matches
          .getMatchById({ path: { matchId } })
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
