import { Context, Effect, Layer, Option, Schema as S } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService } from "../cache/kv-cache";
import {
  PsdMember,
  PsdMembersPage,
  PsdTeam,
  PsdTeamsArray,
} from "@kcvv/api-contract";
import {
  FootbalistoMatchDetailResponse,
  FootbalistoRankingArray,
  PsdSeason,
  PsdSeasonsSchema,
  PsdMatchListSchema,
  PsdTeamStatsResponse,
  type PsdGame,
  type FootbalistoMatchDetailResponse as RawDetailResponse,
  type FootbalistoRankingCompetition,
} from "./schemas";

export class FootbalistoError extends Error {
  readonly _tag = "FootbalistoError" as const;
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FootbalistoError";
  }
}

export class FootbalistoValidationError extends Error {
  readonly _tag = "FootbalistoValidationError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FootbalistoValidationError";
  }
}

export type FootbalistoClientError =
  | FootbalistoError
  | FootbalistoValidationError;

export interface FootbalistoClientInterface {
  readonly getRawMatches: (
    teamId: number,
  ) => Effect.Effect<readonly PsdGame[], FootbalistoClientError>;
  readonly getRawNextMatches: () => Effect.Effect<
    readonly PsdGame[],
    FootbalistoClientError
  >;
  readonly getRawMatchDetail: (
    matchId: number,
  ) => Effect.Effect<RawDetailResponse, FootbalistoClientError>;
  readonly getRawRanking: (
    teamId: number,
  ) => Effect.Effect<
    readonly FootbalistoRankingCompetition[],
    FootbalistoClientError
  >;
  readonly getRawTeamStats: (
    teamId: number,
  ) => Effect.Effect<PsdTeamStatsResponse, FootbalistoClientError>;
  readonly getRawTeams: () => Effect.Effect<
    readonly PsdTeam[],
    FootbalistoClientError
  >;
  readonly getRawMembers: (
    teamId: number,
  ) => Effect.Effect<readonly PsdMember[], FootbalistoClientError>;
}

export class FootbalistoClient extends Context.Tag("FootbalistoClient")<
  FootbalistoClient,
  FootbalistoClientInterface
>() {}

function fetchJson<A, I>(
  url: string,
  schema: S.Schema<A, I>,
  headers: Record<string, string>,
) {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url, { headers }),
      catch: (cause) =>
        new FootbalistoError(`Failed to fetch ${url}`, undefined, cause),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new FootbalistoError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        ),
      );
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new FootbalistoError("Failed to parse JSON", undefined, cause),
    });

    return yield* S.decodeUnknown(schema)(json).pipe(
      Effect.mapError(
        (cause) =>
          new FootbalistoValidationError("Schema validation failed", cause),
      ),
    );
  });
}

export const FootbalistoClientLive = Layer.effect(
  FootbalistoClient,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const cache = yield* KvCacheService;
    const base = env.PSD_API_BASE_URL;

    const psdHeaders = {
      "x-api-key": env.PSD_API_KEY,
      "x-api-club": env.PSD_API_CLUB,
      Authorization: env.PSD_API_AUTH,
      "Accept-Language": "nl-BE",
      "Content-Type": "application/json",
    };

    /** Format an ISO date string as DDMMYYYY for PSD stat endpoint URLs */
    function formatPsdDate(isoDate: string): string {
      const datePart = isoDate.split("T")[0]!; // "YYYY-MM-DD"
      const [year, month, day] = datePart.split("-");
      return `${day}${month}${year}`; // "DDMMYYYY"
    }

    /** Get current season (cached 24h in KV). Returns full PsdSeason for date range access. */
    const getCurrentSeason = (): Effect.Effect<
      PsdSeason,
      FootbalistoClientError
    > =>
      Effect.gen(function* () {
        const cacheKey = "psd:current-season-id";
        const cached = yield* cache.get(cacheKey);
        if (cached) {
          const decoded = yield* Effect.try({
            try: () => JSON.parse(cached),
            catch: () => null,
          }).pipe(Effect.flatMap(S.decodeUnknown(PsdSeason)), Effect.option);
          if (Option.isSome(decoded)) return decoded.value;
        }

        const seasons = yield* fetchJson(
          `${base}/seasons`,
          PsdSeasonsSchema,
          psdHeaders,
        );
        const now = Date.now();
        const current = seasons.find(
          (s) =>
            new Date(s.start).getTime() <= now &&
            new Date(s.end).getTime() >= now,
        );
        if (!current)
          return yield* Effect.fail(
            new FootbalistoError("No active season found"),
          );
        yield* cache.set(cacheKey, JSON.stringify(current), 60 * 60 * 24);
        return current;
      });

    return {
      getRawMatches: (teamId: number) =>
        Effect.gen(function* () {
          const season = yield* getCurrentSeason();
          const data = yield* fetchJson(
            `${base}/games/team/${teamId}/seasons/${season.id}`,
            PsdMatchListSchema,
            psdHeaders,
          );
          return data.content;
        }),
      getRawNextMatches: () =>
        Effect.gen(function* () {
          const teams = yield* fetchJson(
            `${base}/teams`,
            PsdTeamsArray,
            psdHeaders,
          );
          const season = yield* getCurrentSeason();
          const now = Date.now();

          /** Convert PsdGame date + time fields to a UTC millisecond timestamp */
          const toMs = (m: PsdGame): number => {
            const datePart = m.date.split(" ")[0]!;
            const timeStr = m.time ?? "00:00";
            const [year, month, day] = datePart.split("-").map(Number);
            const [hour = 0, minute = 0] = timeStr.split(":").map(Number);
            return Date.UTC(year!, month! - 1, day!, hour, minute);
          };

          const teamNextMatches = yield* Effect.all(
            teams.map((team) =>
              fetchJson(
                `${base}/games/team/${team.id}/seasons/${season.id}`,
                PsdMatchListSchema,
                psdHeaders,
              ).pipe(
                Effect.map((data) => {
                  const next = [...data.content]
                    .filter((m) => toMs(m) >= now)
                    .sort((a, b) => toMs(a) - toMs(b))[0];
                  return next
                    ? ({ ...next, teamId: team.id } as PsdGame)
                    : null;
                }),
                // A single team failing should not abort the whole request
                Effect.catchAll(() => Effect.succeed(null)),
              ),
            ),
            { concurrency: 5 },
          );

          return teamNextMatches.filter((m): m is PsdGame => m !== null);
        }),
      getRawMatchDetail: (matchId: number) =>
        fetchJson(
          `${base}/games/${matchId}/info`,
          FootbalistoMatchDetailResponse,
          psdHeaders,
        ),
      getRawRanking: (teamId: number) =>
        fetchJson(
          `${base}/teams/${teamId}/ranking`,
          FootbalistoRankingArray,
          psdHeaders,
        ),
      getRawTeamStats: (teamId: number) =>
        Effect.gen(function* () {
          const season = yield* getCurrentSeason();
          const from = formatPsdDate(season.start);
          const to = formatPsdDate(season.end);
          return yield* fetchJson(
            `${base}/statistics/team/${teamId}/from/${from}/to/${to}`,
            PsdTeamStatsResponse,
            psdHeaders,
          );
        }),

      getRawTeams: () => fetchJson(`${base}/teams`, PsdTeamsArray, psdHeaders),

      getRawMembers: (teamId: number) =>
        fetchJson(
          `${base}/teams/${teamId}/members`,
          PsdMembersPage,
          psdHeaders,
        ).pipe(Effect.map((page) => page.content)),
    };
  }),
);
