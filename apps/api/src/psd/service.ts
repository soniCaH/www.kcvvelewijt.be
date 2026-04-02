import { Context, Effect, Layer, Option, Schema as S } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService } from "../cache/kv-cache";
import { SanityWriteClient } from "../sanity/client";
import {
  UpstreamUnavailableError,
  UpstreamClientError,
  UpstreamDecodeError,
  ResourceNotFoundError,
  type BffError,
} from "./errors";
import type {
  Match,
  MatchDetail,
  RankingEntry,
  OpponentHistory,
  PlayerSeasonStats,
} from "@kcvv/api-contract";
import {
  PsdSeason,
  PsdSeasonsSchema,
  PsdMatchListSchema,
  FootbalistoMatchDetailResponse,
  FootbalistoRankingArray,
  FootbalistoRankingEntry,
  PsdGame,
  PsdPlayerGameStatisticsResponse,
} from "./schemas";
import { PsdTeamsSchema } from "./schemas-player-team";
import {
  derivePsdTeamLabel,
  transformPsdGame,
  transformFootbalistoMatchDetail,
  matchDetailToMatch,
  transformFootbalistoRankingEntry,
  extractId,
  computeOpponentSummary,
  psdGameToMs,
} from "./transforms";

// ─── Service definition ────────────────────────────────────────────────────────

export interface PsdServiceInterface {
  readonly getTeamMatches: (
    teamId: number,
  ) => Effect.Effect<readonly Match[], BffError>;
  readonly getNextMatches: () => Effect.Effect<readonly Match[], BffError>;
  readonly getMatchById: (matchId: number) => Effect.Effect<Match, BffError>;
  readonly getMatchDetail: (
    matchId: number,
  ) => Effect.Effect<MatchDetail, BffError>;
  readonly getRanking: (
    teamId: number,
    logoCdnUrl: string,
  ) => Effect.Effect<readonly RankingEntry[], BffError>;
  readonly getOpponentHistory: (
    teamId: number,
    clubId: number,
  ) => Effect.Effect<OpponentHistory, BffError>;
  readonly getPlayerStats: (
    memberId: number,
  ) => Effect.Effect<PlayerSeasonStats, BffError>;
  readonly getCurrentSeasonId: () => Effect.Effect<number, BffError>;
}

export class PsdService extends Context.Tag("PsdService")<
  PsdService,
  PsdServiceInterface
>() {}

function classifyHttpError(
  url: string,
  status: number,
  statusText: string,
): BffError {
  if (status === 404) {
    return new ResourceNotFoundError({
      message: `HTTP 404: ${statusText}`,
      resourceType: "psd-resource",
      resourceId: url,
    });
  }
  if (status === 429 || status >= 500) {
    return new UpstreamUnavailableError({
      message: `HTTP ${status}: ${statusText}`,
      status,
    });
  }
  return new UpstreamClientError({
    message: `HTTP ${status}: ${statusText}`,
    status,
    url,
  });
}

function fetchJson<A, I>(
  url: string,
  schema: S.Schema<A, I>,
  headers: Record<string, string>,
): Effect.Effect<A, BffError> {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url, { headers }),
      catch: (cause) =>
        new UpstreamUnavailableError({
          message: `Failed to fetch ${url}`,
          cause,
        }),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        classifyHttpError(url, response.status, response.statusText),
      );
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new UpstreamDecodeError({ message: "Failed to parse JSON", cause }),
    });

    return yield* S.decodeUnknown(schema)(json).pipe(
      Effect.mapError(
        (cause) =>
          new UpstreamDecodeError({
            message: "Schema validation failed",
            cause,
          }),
      ),
    );
  });
}

export const PsdServiceLive = Layer.effect(
  PsdService,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const cache = yield* KvCacheService;
    const sanityClient = yield* SanityWriteClient;
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

    const getCurrentSeason = (): Effect.Effect<PsdSeason, BffError> =>
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
            new ResourceNotFoundError({
              message: "No active season found",
              resourceType: "season",
              resourceId: "current",
            }),
          );
        yield* cache.set(cacheKey, JSON.stringify(current), 60 * 60 * 24);
        return current;
      });

    const VISIBLE_TEAM_IDS_CACHE_KEY = "sanity:visible-team-ids";
    const VISIBLE_TEAM_IDS_TTL = 60 * 60; // 1 hour

    const getVisibleTeamIds = (): Effect.Effect<string[] | undefined, never> =>
      Effect.gen(function* () {
        const cached = yield* cache.get(VISIBLE_TEAM_IDS_CACHE_KEY);
        if (cached) {
          const parsed = yield* Effect.try({
            try: () => JSON.parse(cached),
            catch: () => null,
          }).pipe(Effect.option);
          if (
            Option.isSome(parsed) &&
            Array.isArray(parsed.value) &&
            parsed.value.every(
              (item) => typeof item === "string" && item.trim().length > 0,
            )
          ) {
            return parsed.value as string[];
          }
        }
        const ids = yield* sanityClient
          .getVisibleTeamPsdIds()
          .pipe(
            Effect.catchAll((e) =>
              Effect.log(
                `getVisibleTeamIds: Sanity unavailable, skipping visibility filter: ${e.message}`,
              ).pipe(Effect.as(undefined as string[] | undefined)),
            ),
          );
        if (ids === undefined) return undefined;
        yield* cache.set(
          VISIBLE_TEAM_IDS_CACHE_KEY,
          JSON.stringify(ids),
          VISIBLE_TEAM_IDS_TTL,
        );
        return ids;
      });

    const fetchRawMatchDetail = (matchId: number) =>
      countedFetch(
        `${base}/games/${matchId}/info`,
        FootbalistoMatchDetailResponse,
      );

    return {
      getTeamMatches: (teamId: number) =>
        Effect.gen(function* () {
          const season = yield* getCurrentSeason();
          const data = yield* countedFetch(
            `${base}/games/team/${teamId}/seasons/${season.id}`,
            PsdMatchListSchema,
          );

          const [errors, games] = yield* Effect.partition(
            data.content,
            (item) =>
              S.decodeUnknown(PsdGame)(item).pipe(
                Effect.mapError((parseError) => ({
                  id: extractId(item),
                  parseError,
                })),
              ),
          );

          if (errors.length > 0) {
            const ids = errors.map((e) => e.id).join(", ");
            yield* Effect.log(
              `getTeamMatches(${teamId}): filtered ${errors.length} invalid game(s) — IDs: [${ids}]`,
            );
          }

          return games.map((game) =>
            transformPsdGame({ ...game, teamId: game.teamId ?? teamId }),
          );
        }),

      getNextMatches: () =>
        Effect.gen(function* () {
          const visiblePsdIds = yield* getVisibleTeamIds();
          const teams = yield* countedFetch(`${base}/teams`, PsdTeamsSchema);
          const season = yield* getCurrentSeason();
          const now = Date.now();

          const visibleTeams = visiblePsdIds
            ? teams.filter((t) => visiblePsdIds.includes(String(t.id)))
            : teams;

          const teamNextMatches = yield* Effect.all(
            visibleTeams.map((team) =>
              countedFetch(
                `${base}/games/team/${team.id}/seasons/${season.id}`,
                PsdMatchListSchema,
              ).pipe(
                Effect.flatMap((data) =>
                  Effect.gen(function* () {
                    const [errors, games] = yield* Effect.partition(
                      data.content,
                      (item) =>
                        S.decodeUnknown(PsdGame)(item).pipe(
                          Effect.mapError((parseError) => ({
                            id: extractId(item),
                            parseError,
                          })),
                        ),
                    );

                    if (errors.length > 0) {
                      const ids = errors.map((e) => e.id).join(", ");
                      yield* Effect.log(
                        `getNextMatches(${team.id}): filtered ${errors.length} invalid game(s) — IDs: [${ids}]`,
                      );
                    }

                    const next = [...games]
                      .filter((m) => psdGameToMs(m) >= now)
                      .sort((a, b) => psdGameToMs(a) - psdGameToMs(b))[0];
                    return next
                      ? transformPsdGame({ ...next, teamId: team.id })
                      : null;
                  }),
                ),
                Effect.map((match) => ({ _tag: "ok" as const, match })),
                Effect.catchAll((e) =>
                  Effect.log(
                    `getNextMatches: team ${team.id} failed: ${String(e)}`,
                  ).pipe(Effect.as({ _tag: "failed" as const, match: null })),
                ),
              ),
            ),
            { concurrency: 5 },
          );

          const allFailed =
            visibleTeams.length > 0 &&
            teamNextMatches.every((r) => r._tag === "failed");

          if (allFailed) {
            return yield* Effect.fail(
              new UpstreamUnavailableError({
                message: `getNextMatches: all ${visibleTeams.length} team fetches failed`,
              }),
            );
          }

          // Pair each result with its team so we can derive the label
          const matches: Match[] = [];
          for (let i = 0; i < teamNextMatches.length; i++) {
            const entry = teamNextMatches[i]!;
            if (entry._tag === "ok" && entry.match) {
              const team = visibleTeams[i]!;
              matches.push({
                ...entry.match,
                kcvv_team_label: derivePsdTeamLabel(team.name, team.age),
              });
            }
          }
          return matches;
        }),

      getMatchById: (matchId: number) =>
        fetchRawMatchDetail(matchId).pipe(
          Effect.map(transformFootbalistoMatchDetail),
          Effect.map(matchDetailToMatch),
        ),

      getMatchDetail: (matchId: number) =>
        fetchRawMatchDetail(matchId).pipe(
          Effect.map(transformFootbalistoMatchDetail),
        ),

      getRanking: (teamId: number, logoCdnUrl: string) =>
        Effect.gen(function* () {
          const competitions = yield* countedFetch(
            `${base}/teams/${teamId}/ranking`,
            FootbalistoRankingArray,
          );

          const competition =
            competitions.find(
              (c) =>
                c.teams.length > 0 &&
                c.type.toUpperCase() !== "CUP" &&
                c.type.toUpperCase() !== "FRIENDLY",
            ) ?? competitions.find((c) => c.teams.length > 0);

          if (!competition || competition.teams.length === 0) {
            return [] as readonly RankingEntry[];
          }

          const [errors, entries] = yield* Effect.partition(
            competition.teams,
            (item) =>
              S.decodeUnknown(FootbalistoRankingEntry)(item).pipe(
                Effect.mapError((parseError) => ({
                  id: extractId(item),
                  parseError,
                })),
              ),
          );

          if (errors.length > 0) {
            const ids = errors.map((e) => e.id).join(", ");
            yield* Effect.log(
              `getRanking(${teamId}): filtered ${errors.length} invalid ranking entry(ies) — IDs: [${ids}]`,
            );
          }

          if (entries.length === 0) {
            return yield* Effect.fail(
              new ResourceNotFoundError({
                message: `getRanking(${teamId}): all ${competition.teams.length} entries were invalid after filtering`,
                resourceType: "ranking",
                resourceId: teamId,
              }),
            );
          }

          return entries.map((e) =>
            transformFootbalistoRankingEntry(e, logoCdnUrl),
          );
        }),

      getOpponentHistory: (teamId: number, clubId: number) =>
        Effect.gen(function* () {
          // Fetch all available seasons (not just current)
          const allSeasons = yield* countedFetch(
            `${base}/seasons`,
            PsdSeasonsSchema,
          );

          // Fetch matches for every season in parallel, skipping failed seasons
          const seasonResults = yield* Effect.all(
            allSeasons.map((season) =>
              countedFetch(
                `${base}/games/team/${teamId}/seasons/${season.id}`,
                PsdMatchListSchema,
              ).pipe(
                Effect.flatMap((data) =>
                  Effect.gen(function* () {
                    const [errors, games] = yield* Effect.partition(
                      data.content,
                      (item) =>
                        S.decodeUnknown(PsdGame)(item).pipe(
                          Effect.mapError((parseError) => ({
                            id: extractId(item),
                            parseError,
                          })),
                        ),
                    );
                    if (errors.length > 0) {
                      const ids = errors.map((e) => e.id).join(", ");
                      yield* Effect.log(
                        `getOpponentHistory(${teamId}): season ${season.id}: filtered ${errors.length} invalid game(s) — IDs: [${ids}]`,
                      );
                    }
                    return games.map((g) => transformPsdGame({ ...g, teamId }));
                  }),
                ),
                Effect.map((matches) => ({ _tag: "ok" as const, matches })),
                Effect.catchAll((e) =>
                  Effect.log(
                    `getOpponentHistory: season ${season.id} failed: ${String(e)}`,
                  ).pipe(
                    Effect.as({
                      _tag: "failed" as const,
                      matches: [] as Match[],
                    }),
                  ),
                ),
              ),
            ),
            { concurrency: 5 },
          );

          // Flatten and filter by opponent club ID
          const allMatches = seasonResults.flatMap((r) => r.matches);
          const opponentMatches = allMatches.filter(
            (m) => m.home_team.id === clubId || m.away_team.id === clubId,
          );

          const hasFailed = seasonResults.some((r) => r._tag === "failed");
          if (opponentMatches.length === 0) {
            if (!hasFailed) {
              return yield* Effect.fail(
                new ResourceNotFoundError({
                  message: `No matches found against club ${clubId} for team ${teamId}`,
                  resourceType: "opponent-history",
                  resourceId: String(clubId),
                }),
              );
            }
            // Some seasons failed — can't determine definitively; propagate as upstream error
            return yield* Effect.fail(
              new UpstreamUnavailableError({
                status: 503,
                message: `Partial season fetch failure for team ${teamId}; cannot determine opponent history for club ${clubId}`,
              }),
            );
          }

          // Best-effort: fetch team metadata to derive the KCVV team label.
          // Errors are swallowed so a /teams failure never discards a valid history.
          const kcvvTeamLabel = yield* countedFetch(
            `${base}/teams`,
            PsdTeamsSchema,
          ).pipe(
            Effect.map((teams) => {
              const team = teams.find((t) => t.id === teamId);
              return team ? derivePsdTeamLabel(team.name, team.age) : undefined;
            }),
            Effect.catchAll(() => Effect.succeed(undefined)),
          );

          // Enrich matches:
          // - is_home: fall back to club-ID comparison when homeTeamId is absent
          // - kcvv_team_label: set from team metadata (mirrors getNextMatches)
          const enrichedMatches = opponentMatches.map((m) => ({
            ...m,
            is_home: m.is_home ?? m.home_team.id !== clubId,
            kcvv_team_label: kcvvTeamLabel,
          }));

          const summary = computeOpponentSummary(enrichedMatches);

          // Sort descending by date (most recent first)
          const sortedMatches = [...enrichedMatches].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

          // Derive opponent info from the most recent match (newest logo/name)
          const mostRecentMatch = sortedMatches[0]!;
          const opponentClub =
            mostRecentMatch.home_team.id === clubId
              ? mostRecentMatch.home_team
              : mostRecentMatch.away_team;

          return {
            opponent: {
              id: opponentClub.id,
              name: opponentClub.name,
              logo: opponentClub.logo,
            },
            summary,
            matches: sortedMatches,
          };
        }),

      getPlayerStats: (memberId: number) =>
        Effect.gen(function* () {
          const season = yield* getCurrentSeason();
          const formatDate = (iso: string): string => {
            const d = new Date(iso);
            const dd = String(d.getUTCDate()).padStart(2, "0");
            const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
            const yyyy = String(d.getUTCFullYear());
            return `${dd}${mm}${yyyy}`;
          };
          const dateFrom = formatDate(season.start);
          const dateTo = formatDate(season.end);

          const response = yield* countedFetch(
            `${base}/statistics/player/${memberId}/from/${dateFrom}/to/${dateTo}`,
            PsdPlayerGameStatisticsResponse,
          );

          return {
            memberId,
            teams: response.playerStatistics.map((ps) => ({
              team: ps.team ?? "Unknown",
              gamesPlayed: ps.gamesPlayed,
              gamesWon: ps.gamesWon,
              gamesEqual: ps.gamesEqual,
              gamesLost: ps.gamesLost,
              goals: ps.goals,
              assists: ps.assists,
              yellowCards: ps.yellowCards,
              redCards: ps.redCards,
              minutes: ps.minutes,
            })),
          };
        }),

      getCurrentSeasonId: () =>
        getCurrentSeason().pipe(Effect.map((s) => s.id)),
    };
  }),
);
