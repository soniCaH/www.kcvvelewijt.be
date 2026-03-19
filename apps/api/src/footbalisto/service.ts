import { Context, Effect, Layer, Option, Schema as S } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService } from "../cache/kv-cache";
import {
  TeamStats,
  type TeamStats as TeamStatsType,
  type Match,
  type MatchDetail,
  PsdTeamsArray,
} from "@kcvv/api-contract";
import {
  PsdSeason,
  PsdSeasonsSchema,
  PsdTeamStatsResponse,
  PsdMatchListSchema,
  FootbalistoMatchDetailResponse,
  type PsdGame,
} from "./schemas";
import {
  transformPsdTeamStats,
  transformPsdGame,
  transformFootbalistoMatchDetail,
  matchDetailToMatch,
} from "./transforms";

export class FootbalistoServiceError extends Error {
  readonly _tag = "FootbalistoServiceError" as const;
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FootbalistoServiceError";
  }
}

export interface FootbalistoServiceInterface {
  readonly getTeamStats: (
    teamId: number,
  ) => Effect.Effect<TeamStatsType, FootbalistoServiceError>;
  readonly getTeamMatches: (
    teamId: number,
  ) => Effect.Effect<readonly Match[], FootbalistoServiceError>;
  readonly getNextMatches: () => Effect.Effect<
    readonly Match[],
    FootbalistoServiceError
  >;
  readonly getMatchById: (
    matchId: number,
  ) => Effect.Effect<Match, FootbalistoServiceError>;
  readonly getMatchDetail: (
    matchId: number,
  ) => Effect.Effect<MatchDetail, FootbalistoServiceError>;
}

export class FootbalistoService extends Context.Tag("FootbalistoService")<
  FootbalistoService,
  FootbalistoServiceInterface
>() {}

function fetchJson<A, I>(
  url: string,
  schema: S.Schema<A, I>,
  headers: Record<string, string>,
): Effect.Effect<A, FootbalistoServiceError> {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url, { headers }),
      catch: (cause) =>
        new FootbalistoServiceError(`Failed to fetch ${url}`, undefined, cause),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new FootbalistoServiceError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        ),
      );
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new FootbalistoServiceError("Failed to parse JSON", undefined, cause),
    });

    return yield* S.decodeUnknown(schema)(json).pipe(
      Effect.mapError(
        (cause) =>
          new FootbalistoServiceError(
            "Schema validation failed",
            undefined,
            cause,
          ),
      ),
    );
  });
}

/** Format an ISO date string as DDMMYYYY for PSD stat endpoint URLs */
function formatPsdDate(isoDate: string): string {
  const datePart = isoDate.split("T")[0] ?? "";
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) {
    throw new Error(
      `formatPsdDate: expected ISO date string, got "${isoDate}"`,
    );
  }
  return `${day}${month}${year}`;
}

export const FootbalistoServiceLive = Layer.effect(
  FootbalistoService,
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

    const todayKey = () => {
      const d = new Date();
      return `psd:calls:${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    };

    const countedFetch = <A, I>(url: string, schema: S.Schema<A, I>) =>
      fetchJson(url, schema, psdHeaders).pipe(
        Effect.ensuring(cache.increment(todayKey())),
      );

    const getCurrentSeason = (): Effect.Effect<
      PsdSeason,
      FootbalistoServiceError
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

        const seasons = yield* countedFetch(
          `${base}/seasons`,
          PsdSeasonsSchema,
        );
        const now = Date.now();
        const current = seasons.find(
          (s) =>
            new Date(s.start).getTime() <= now &&
            new Date(s.end).getTime() >= now,
        );
        if (!current)
          return yield* Effect.fail(
            new FootbalistoServiceError("No active season found"),
          );
        yield* cache.set(cacheKey, JSON.stringify(current), 60 * 60 * 24);
        return current;
      });

    /** Convert a PsdGame date + time fields to UTC milliseconds */
    const toMs = (m: PsdGame): number => {
      const datePart = m.date.split(" ")[0]!;
      const timeStr = m.time ?? m.date.split(" ")[1] ?? "00:00";
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour = 0, minute = 0] = timeStr.split(":").map(Number);
      return Date.UTC(year!, month! - 1, day!, hour, minute);
    };

    const fetchRawMatchDetail = (matchId: number) =>
      countedFetch(
        `${base}/games/${matchId}/info`,
        FootbalistoMatchDetailResponse,
      );

    return {
      getTeamStats: (teamId: number) =>
        Effect.gen(function* () {
          const season = yield* getCurrentSeason();
          const from = formatPsdDate(season.start);
          const to = formatPsdDate(season.end);
          const rawStats = yield* countedFetch(
            `${base}/statistics/team/${teamId}/from/${from}/to/${to}`,
            PsdTeamStatsResponse,
          );
          return transformPsdTeamStats(teamId, rawStats);
        }),

      getTeamMatches: (teamId: number) =>
        Effect.gen(function* () {
          const season = yield* getCurrentSeason();
          const data = yield* countedFetch(
            `${base}/games/team/${teamId}/seasons/${season.id}`,
            PsdMatchListSchema,
          );
          return data.content.map(transformPsdGame);
        }),

      getNextMatches: () =>
        Effect.gen(function* () {
          const teams = yield* countedFetch(`${base}/teams`, PsdTeamsArray);
          const season = yield* getCurrentSeason();
          const now = Date.now();

          const teamNextMatches = yield* Effect.all(
            teams
              .filter((t) => t.id !== 23)
              .map((team) =>
                countedFetch(
                  `${base}/games/team/${team.id}/seasons/${season.id}`,
                  PsdMatchListSchema,
                ).pipe(
                  Effect.map((data) => {
                    const next = [...data.content]
                      .filter((m) => toMs(m) >= now)
                      .sort((a, b) => toMs(a) - toMs(b))[0];
                    return next
                      ? ({ ...next, teamId: team.id } as PsdGame)
                      : null;
                  }),
                  Effect.catchAll((e) =>
                    Effect.log(
                      `getNextMatches: team ${team.id} failed: ${String(e)}`,
                    ).pipe(Effect.as(null)),
                  ),
                ),
              ),
            { concurrency: 5 },
          );

          // Filter out nulls (team 23 is excluded before fetching)
          return teamNextMatches
            .filter((m): m is PsdGame => m !== null)
            .map(transformPsdGame);
        }),

      getMatchById: (matchId: number) =>
        fetchRawMatchDetail(matchId).pipe(
          Effect.map((raw) =>
            matchDetailToMatch(transformFootbalistoMatchDetail(raw)),
          ),
        ),

      getMatchDetail: (matchId: number) =>
        fetchRawMatchDetail(matchId).pipe(
          Effect.map(transformFootbalistoMatchDetail),
        ),
    };
  }),
);
