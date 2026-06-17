import { Context, Effect, Layer, Option, Schema as S } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService } from "../cache/kv-cache";
import { SanityProjection } from "../sanity/projection";
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
  CompetitionType,
  RankingEntry,
  OpponentHistory,
  PlayerSeasonStats,
} from "@kcvv/api-contract";
import {
  PsdSeason,
  PsdSeasonsSchema,
  PsdMatchListSchema,
  PsdCompetitionsSchema,
  FootbalistoMatchDetailResponse,
  FootbalistoRankingArray,
  FootbalistoRankingEntry,
  PsdGame,
  PsdPlayerGameStatisticsResponse,
} from "./schemas";
import { PsdTeamsSchema } from "./schemas-player-team";
import {
  derivePsdTeamLabel,
  deriveOwnClubId,
  transformPsdGame,
  buildCompetitionLabelMap,
  type CompetitionLabelMap,
  resolveCompetitionType,
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
  readonly getMatchesWindow: () => Effect.Effect<readonly Match[], BffError>;
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
    const projection = yield* SanityProjection;
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

    // /competitions is the club's competition catalogue — it changes rarely, so
    // cache the derived id→label map for a week. Best-effort: on any failure the
    // map is empty and transforms fall back to the generic competitionType label.
    const COMPETITION_LABELS_CACHE_KEY = "psd:competition-labels";
    const COMPETITION_LABELS_TTL = 60 * 60 * 24 * 7; // 7 days

    const getCompetitionLabels = (): Effect.Effect<
      CompetitionLabelMap,
      never
    > =>
      Effect.gen(function* () {
        const cached = yield* cache.get(COMPETITION_LABELS_CACHE_KEY);
        if (cached) {
          const parsed = yield* Effect.try({
            try: () => JSON.parse(cached) as CompetitionLabelMap,
            catch: () => null,
          }).pipe(Effect.option);
          if (
            Option.isSome(parsed) &&
            parsed.value !== null &&
            typeof parsed.value === "object"
          ) {
            return parsed.value;
          }
        }
        const map = yield* countedFetch(
          `${base}/competitions`,
          PsdCompetitionsSchema,
        ).pipe(
          Effect.map(buildCompetitionLabelMap),
          Effect.catchAll((e) =>
            Effect.log(
              `getCompetitionLabels: /competitions unavailable, using generic labels: ${String(e)}`,
            ).pipe(Effect.as({} as CompetitionLabelMap)),
          ),
        );
        if (Object.keys(map).length > 0) {
          yield* cache.set(
            COMPETITION_LABELS_CACHE_KEY,
            JSON.stringify(map),
            COMPETITION_LABELS_TTL,
          );
        }
        return map;
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
        const ids = yield* projection
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

    // ─── Match → team/competition index ───────────────────────────────────────
    // The match-detail endpoint (`/games/{id}/info`, queried by match id) carries
    // NEITHER a reliable competition type (it inlines a display string) NOR a team
    // id. Both live only on the per-team season-games endpoint. We build a
    // `matchId → {teamId, competitionType}` index from every team's
    // current-season games and reuse it to enrich `getMatchDetail`.
    //
    // Caching is deliberate (owner-flagged PSD + Workers-KV quota): the build
    // fans out one fetch per team, so the whole index is cached as a SINGLE KV
    // entry with a long TTL. Match→team assignments change at most weekly
    // (new/rescheduled fixtures), and the index is independent of standings
    // freshness (that's `getRanking`'s concern) — so a long TTL costs nothing in
    // live-site accuracy while keeping us far under quota.
    const MATCH_TEAM_INDEX_CACHE_KEY = "psd:match-team-index";
    const MATCH_TEAM_INDEX_TTL = 60 * 60 * 12; // 12h
    // Negative-cache an empty index briefly so a partial upstream outage (e.g.
    // /info ok but the per-team fetches fail) can't trigger a ~20-fetch rebuild
    // on every request, while still recovering within minutes once PSD heals.
    const MATCH_TEAM_INDEX_EMPTY_TTL = 120; // 2m

    interface MatchTeamIndexEntry {
      teamId: number;
      competitionType: CompetitionType;
    }
    type MatchTeamIndex = Record<string, MatchTeamIndexEntry>;

    const buildMatchTeamIndex = (): Effect.Effect<MatchTeamIndex, BffError> =>
      Effect.gen(function* () {
        const teams = yield* countedFetch(`${base}/teams`, PsdTeamsSchema);
        const season = yield* getCurrentSeason();

        const perTeam = yield* Effect.all(
          teams.map((team) =>
            countedFetch(
              `${base}/games/team/${team.id}/seasons/${season.id}`,
              PsdMatchListSchema,
            ).pipe(
              Effect.map((data) => ({ team, content: data.content })),
              // A single failed team must not sink the whole index (mirrors
              // getNextMatches' per-team resilience).
              Effect.catchAll((e) =>
                Effect.log(
                  `buildMatchTeamIndex: team ${team.id} failed: ${String(e)}`,
                ).pipe(Effect.as({ team, content: [] as readonly unknown[] })),
              ),
            ),
          ),
          { concurrency: 5 },
        );

        const index: MatchTeamIndex = {};
        for (const { team, content } of perTeam) {
          for (const item of content) {
            const decoded = S.decodeUnknownOption(PsdGame)(item);
            if (Option.isNone(decoded)) continue;
            const game = decoded.value;
            const key = String(game.id);
            // First write wins — deterministic for the rare KCVV-internal match
            // that appears in two teams' lists (always a friendly → no standings).
            if (index[key]) continue;
            index[key] = {
              teamId: team.id,
              competitionType: resolveCompetitionType(game.competitionType),
            };
          }
        }
        return index;
      });

    const getMatchTeamIndex = (): Effect.Effect<MatchTeamIndex, never> =>
      Effect.gen(function* () {
        const cached = yield* cache.get(MATCH_TEAM_INDEX_CACHE_KEY);
        if (cached) {
          const parsed = yield* Effect.try({
            try: () => JSON.parse(cached) as MatchTeamIndex,
            catch: () => null,
          }).pipe(Effect.option);
          if (
            Option.isSome(parsed) &&
            parsed.value !== null &&
            typeof parsed.value === "object"
          ) {
            return parsed.value;
          }
        }

        // Best-effort: any build failure (typed error OR defect) yields an empty
        // index, so enrichment becomes a no-op and `getMatchDetail` behaves
        // exactly as before — the match page must never degrade on index trouble.
        const built = yield* buildMatchTeamIndex().pipe(
          Effect.catchAllCause((cause) =>
            Effect.log(
              `getMatchTeamIndex: build failed: ${String(cause)}`,
            ).pipe(Effect.as({} as MatchTeamIndex)),
          ),
        );
        // Always cache — a non-empty index for 12h, an empty one (build failure)
        // only briefly, so we never re-fan-out the full build on every request
        // during an incident yet recover quickly afterwards.
        yield* cache.set(
          MATCH_TEAM_INDEX_CACHE_KEY,
          JSON.stringify(built),
          Object.keys(built).length > 0
            ? MATCH_TEAM_INDEX_TTL
            : MATCH_TEAM_INDEX_EMPTY_TTL,
        );
        return built;
      });

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

          const ownClubId = deriveOwnClubId(games);
          const competitionLabels = yield* getCompetitionLabels();
          return games.map((game) =>
            transformPsdGame(
              { ...game, teamId: game.teamId ?? teamId },
              { ownClubId, competitionLabels },
            ),
          );
        }),

      getNextMatches: () =>
        Effect.gen(function* () {
          const visiblePsdIds = yield* getVisibleTeamIds();
          const teams = yield* countedFetch(`${base}/teams`, PsdTeamsSchema);
          const season = yield* getCurrentSeason();
          const competitionLabels = yield* getCompetitionLabels();
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

                    const ownClubId = deriveOwnClubId(games);
                    const next = [...games]
                      .filter((m) => psdGameToMs(m) >= now)
                      .sort((a, b) => psdGameToMs(a) - psdGameToMs(b))[0];
                    return next
                      ? transformPsdGame(
                          { ...next, teamId: team.id },
                          { ownClubId, competitionLabels },
                        )
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

      getMatchesWindow: () =>
        Effect.gen(function* () {
          const visiblePsdIds = yield* getVisibleTeamIds();
          const teams = yield* countedFetch(`${base}/teams`, PsdTeamsSchema);
          const season = yield* getCurrentSeason();
          const competitionLabels = yield* getCompetitionLabels();

          // Window: [start of today (Brussels), now + 7 days].
          // The lower bound is the start of the current Brussels calendar day,
          // expressed in the same wall-clock-as-UTC space psdGameToMs uses
          // (PSD stores wall-clock times as plain "YYYY-MM-DD HH:MM" strings),
          // so a match that already kicked off earlier today still qualifies —
          // the key difference from getNextMatches, which drops it once
          // psdGameToMs(m) < now. The 7-day upper bound covers pre-game posts;
          // a couple of hours of timezone fuzz at its far edge is immaterial.
          const now = Date.now();
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          const brusselsToday = new Date(now).toLocaleDateString("en-CA", {
            timeZone: "Europe/Brussels",
          });
          const [ty, tm, td] = brusselsToday.split("-").map(Number);
          const startOfTodayMs = Date.UTC(ty!, tm! - 1, td!, 0, 0, 0);
          const windowEndMs = now + SEVEN_DAYS_MS;

          const visibleTeams = visiblePsdIds
            ? teams.filter((t) => visiblePsdIds.includes(String(t.id)))
            : teams;

          const teamWindowMatches = yield* Effect.all(
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
                        `getMatchesWindow(${team.id}): filtered ${errors.length} invalid game(s) — IDs: [${ids}]`,
                      );
                    }

                    const ownClubId = deriveOwnClubId(games);
                    return games
                      .filter((m) => {
                        const ms = psdGameToMs(m);
                        return ms >= startOfTodayMs && ms <= windowEndMs;
                      })
                      .map((game) =>
                        transformPsdGame(
                          { ...game, teamId: team.id },
                          { ownClubId, competitionLabels },
                        ),
                      );
                  }),
                ),
                Effect.map((windowed) => ({
                  _tag: "ok" as const,
                  matches: windowed,
                })),
                Effect.catchAll((e) =>
                  Effect.log(
                    `getMatchesWindow: team ${team.id} failed: ${String(e)}`,
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

          const allFailed =
            visibleTeams.length > 0 &&
            teamWindowMatches.every((r) => r._tag === "failed");

          if (allFailed) {
            return yield* Effect.fail(
              new UpstreamUnavailableError({
                message: `getMatchesWindow: all ${visibleTeams.length} team fetches failed`,
              }),
            );
          }

          // Flatten all in-window games across teams, tagging each with its
          // KCVV team label, then sort by kickoff ascending.
          const matches: Match[] = [];
          for (let i = 0; i < teamWindowMatches.length; i++) {
            const entry = teamWindowMatches[i]!;
            if (entry._tag === "ok") {
              const team = visibleTeams[i]!;
              const label = derivePsdTeamLabel(team.name, team.age);
              for (const match of entry.matches) {
                matches.push({ ...match, kcvv_team_label: label });
              }
            }
          }
          matches.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
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
          // Enrich with the team id + structured competition type that
          // `/games/{id}/info` cannot provide (see the match-team index above).
          // Strictly additive: an index miss/failure leaves the detail exactly
          // as transformed (incl. `is_home` — keeper enrichment is unaffected).
          Effect.flatMap((detail) =>
            getMatchTeamIndex().pipe(
              Effect.map((index) => {
                const entry = index[String(matchId)];
                if (!entry) return detail;
                return {
                  ...detail,
                  kcvv_team_id: entry.teamId,
                  competitionType: entry.competitionType,
                };
              }),
            ),
          ),
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
          const competitionLabels = yield* getCompetitionLabels();

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
                    const ownClubId = deriveOwnClubId(games);
                    return games.map((g) =>
                      transformPsdGame(
                        { ...g, teamId },
                        { ownClubId, competitionLabels },
                      ),
                    );
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
          // - is_home: secondary fallback using the opponent clubId parameter.
          //   transformPsdGame already uses ownClubId (derived from game data),
          //   but this acts as a safety net using the caller-provided clubId.
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
