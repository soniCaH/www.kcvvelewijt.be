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
import {
  type Match,
  type MatchDetail,
  type MatchLineupPlayer,
  type RankingEntry,
  type CardType,
  type OpponentHistory,
  PsdTeamsArray,
} from "@kcvv/api-contract";
import {
  PsdSeason,
  PsdSeasonsSchema,
  PsdMatchListSchema,
  FootbalistoMatchDetailResponse,
  FootbalistoRankingArray,
  PsdGame,
  type FootbalistoLineupPlayer,
  type FootbalistoMatchEvent,
  type FootbalistoMatchDetailResponse as RawDetailResponse,
  type FootbalistoRankingEntry,
} from "./schemas";

// ─── Transform helpers (internal) ──────────────────────────────────────────────

/**
 * Map a PSD competition type code + optional name to a Dutch display label.
 *
 * - LEAGUE → "Competitie"
 * - CUP    → PSD name when available (e.g. "Beker van Brabant"), else "Beker"
 * - FRIENDLY → "Vriendschappelijk"
 * - Unknown type codes fall back to the raw type string.
 */
export function mapCompetitionLabel(
  type: string,
  name?: string | null,
): string {
  switch (type.toUpperCase()) {
    case "LEAGUE":
      return "Competitie";
    case "CUP":
      return name?.trim() || "Beker";
    case "FRIENDLY":
      return "Vriendschappelijk";
    default:
      return type;
  }
}

/**
 * Derive a human-readable team label from PSD team name and age group.
 *
 * Youth teams (age !== "A"): use the age directly (e.g. "U21", "U17").
 * Senior teams (age === "A"): check if name ends with " B" → "B-Ploeg", else "A-Ploeg".
 */
function derivePsdTeamLabel(name: string, age: string): string {
  if (age !== "A") return age;
  return name.endsWith(" B") ? "B-Ploeg" : "A-Ploeg";
}

/**
 * Map PSD numeric game status + goal presence to a normalized MatchStatus.
 *
 * PSD status codes (empirically derived — not documented in API spec):
 *   0 = no special status; "finished" when goals are set, "scheduled" otherwise
 *   1 = FF  (forfait)            → "forfeited"
 *   2 = AFG (afgelast)           → "postponed"  (may be rescheduled)
 *   3 = STOP (ended prematurely) → "stopped"    (may be rescheduled)
 *
 * The `cancelled` boolean takes full precedence — if true, status is always "postponed"
 * regardless of the numeric code (unknown codes are still logged in that path).
 * Any unknown code (when not cancelled) falls back to "scheduled" (safe default).
 * Unknown codes are logged so we can detect undocumented PSD values in production.
 */
export function mapGameStatus(
  status: number,
  goalsHome: number | null,
  goalsAway: number | null,
  cancelled?: boolean | null,
): Effect.Effect<Match["status"]> {
  const warnUnknown = Effect.logWarning(
    `[transforms] Unknown PSD game status code: ${status}`,
  );

  if (cancelled) {
    if (status !== 0 && status !== 1 && status !== 2 && status !== 3) {
      return Effect.as(warnUnknown, "postponed" as const);
    }
    return Effect.succeed("postponed" as const);
  }
  if (status === 1) return Effect.succeed("forfeited" as const);
  if (status === 2) return Effect.succeed("postponed" as const);
  if (status === 3) return Effect.succeed("stopped" as const);
  if (status === 0) {
    return Effect.succeed(
      goalsHome !== null && goalsAway !== null ? "finished" : "scheduled",
    );
  }
  return Effect.as(warnUnknown, "scheduled" as const);
}

function parseDateString(dateStr: string): { date: Date; time: string } {
  const [datePart, timePart = "00:00"] = dateStr.split(" ");
  const [year, month, day] = datePart!.split("-").map(Number);
  const [hour = 0, minute = 0] = timePart.split(":").map(Number);
  return {
    date: new Date(Date.UTC(year!, month! - 1, day!, hour, minute)),
    time: timePart,
  };
}

function transformPsdGame(game: PsdGame): Effect.Effect<Match> {
  const datePart = game.date.split(" ")[0]!;
  const timeStr = game.time ?? game.date.split(" ")[1] ?? "00:00";
  const { date: matchDate, time: timePart } = parseDateString(
    `${datePart} ${timeStr}`,
  );

  const isHome =
    game.homeTeamId != null && game.teamId != null
      ? game.homeTeamId === game.teamId
      : undefined;

  return mapGameStatus(
    game.status,
    game.goalsHomeTeam,
    game.goalsAwayTeam,
    game.cancelled,
  ).pipe(
    Effect.map((status) => ({
      id: game.id,
      date: matchDate,
      time: timePart,
      venue: undefined,
      home_team: {
        id: game.homeClub.id,
        name: game.homeClub.name,
        logo: game.homeClub.logo ?? undefined,
        score: game.goalsHomeTeam ?? undefined,
      },
      away_team: {
        id: game.awayClub.id,
        name: game.awayClub.name,
        logo: game.awayClub.logo ?? undefined,
        score: game.goalsAwayTeam ?? undefined,
      },
      status,
      competition: mapCompetitionLabel(
        game.competitionType?.type ?? "UNKNOWN",
        game.competitionType?.name,
      ),
      kcvv_team_id: game.teamId ?? undefined,
      is_home: isHome,
    })),
  );
}

function transformLineupStatus(
  status?: string,
  changed?: boolean,
): "starter" | "substitute" | "substituted" | "subbed_in" | "unknown" {
  if (status === "basis") return changed ? "substituted" : "starter";
  if (status === "invaller" || status === "bank")
    return changed ? "subbed_in" : "substitute";
  if (status === "wissel") return "substituted";
  return "unknown";
}

function transformLineupPlayer(
  player: FootbalistoLineupPlayer,
): MatchLineupPlayer {
  return {
    id: player.playerId ?? undefined,
    name: player.playerName,
    number: player.number ?? undefined,
    minutesPlayed: player.minutesPlayed ?? undefined,
    isCaptain: player.captain ?? false,
    status: transformLineupStatus(player.status, player.changed),
  };
}

function parseCardType(event: FootbalistoMatchEvent): CardType | undefined {
  const type = event.action.type.toUpperCase();
  const subtype = event.action.subtype?.toLowerCase();
  if (type !== "CARD") return undefined;
  switch (subtype) {
    case "yellow":
    case "geel":
      return "yellow";
    case "red":
    case "rood":
      return "red";
    case "double_yellow":
    case "yellowred":
    case "tweedegeel":
    case "tweede_geel":
      return "double_yellow";
    default:
      return undefined;
  }
}

function buildPlayerCardMap(
  events: readonly FootbalistoMatchEvent[],
): Map<number, CardType> {
  const cardMap = new Map<number, CardType>();
  for (const event of events) {
    const cardType = parseCardType(event);
    const playerId = event.playerId;
    if (cardType && playerId != null) {
      const existing = cardMap.get(playerId);
      if (existing === "yellow" && cardType === "yellow") {
        cardMap.set(playerId, "double_yellow");
      } else if (cardType === "red" || cardType === "double_yellow") {
        cardMap.set(playerId, cardType);
      } else if (!existing) {
        cardMap.set(playerId, cardType);
      }
    }
  }
  return cardMap;
}

function transformPlayerWithCard(
  player: FootbalistoLineupPlayer,
  cardMap: Map<number, CardType> | null,
): MatchLineupPlayer {
  const base = transformLineupPlayer(player);
  const card = cardMap && base.id ? cardMap.get(base.id) : undefined;
  return card ? { ...base, card } : base;
}

function transformFootbalistoMatchDetail(
  response: RawDetailResponse,
): Effect.Effect<MatchDetail> {
  const general = response.general;
  const { date: matchDate, time: timePart } = parseDateString(general.date);
  const cardMap = response.events ? buildPlayerCardMap(response.events) : null;

  let lineup:
    | { home: MatchLineupPlayer[]; away: MatchLineupPlayer[] }
    | undefined;
  if (response.lineup || response.substitutes) {
    lineup = {
      home: [
        ...(response.lineup?.home ?? []).map((p) =>
          transformPlayerWithCard(p, cardMap),
        ),
        ...(response.substitutes?.home ?? []).map((p) =>
          transformPlayerWithCard(p, cardMap),
        ),
      ],
      away: [
        ...(response.lineup?.away ?? []).map((p) =>
          transformPlayerWithCard(p, cardMap),
        ),
        ...(response.substitutes?.away ?? []).map((p) =>
          transformPlayerWithCard(p, cardMap),
        ),
      ],
    };
  }

  return mapGameStatus(
    general.status,
    general.goalsHomeTeam,
    general.goalsAwayTeam,
    general.cancelled,
  ).pipe(
    Effect.map((status) => ({
      id: general.id,
      date: matchDate,
      time: timePart,
      venue: undefined,
      home_team: {
        id: general.homeClub.id,
        name: general.homeClub.name,
        logo: general.homeClub.logo ?? undefined,
        score: general.goalsHomeTeam ?? undefined,
      },
      away_team: {
        id: general.awayClub.id,
        name: general.awayClub.name,
        logo: general.awayClub.logo ?? undefined,
        score: general.goalsAwayTeam ?? undefined,
      },
      status,
      competition: mapCompetitionLabel(
        typeof general.competitionType === "object"
          ? (general.competitionType?.type ?? "UNKNOWN")
          : "UNKNOWN",
        typeof general.competitionType === "object"
          ? general.competitionType?.name
          : (general.competitionType ?? undefined),
      ),
      lineup,
      hasReport: general.viewGameReport,
    })),
  );
}

/** Strip lineup from a MatchDetail to produce a basic Match */
function matchDetailToMatch(detail: MatchDetail): Match {
  return {
    id: detail.id,
    date: detail.date,
    time: detail.time,
    venue: detail.venue,
    home_team: detail.home_team,
    away_team: detail.away_team,
    status: detail.status,
    competition: detail.competition,
  };
}

function transformFootbalistoRankingEntry(
  entry: FootbalistoRankingEntry,
  logoCdnUrl: string,
): RankingEntry {
  const cdn = logoCdnUrl.replace(/\/+$/, "");
  const teamName =
    entry.team.club.localName || entry.team.club.name || "Unknown Team";
  return {
    position: entry.rank,
    team_id: entry.team.id,
    team_name: teamName,
    team_logo: `${cdn}/extra_groot/${entry.team.club.id}.png`,
    played: entry.matchesPlayed,
    won: entry.wins,
    drawn: entry.draws,
    lost: entry.losses,
    goals_for: entry.goalsScored,
    goals_against: entry.goalsConceded,
    goal_difference: entry.goalsScored - entry.goalsConceded,
    points: entry.points,
    form: undefined,
  };
}

/** Safely extract an `id` field from an unknown item for logging. */
function extractId(item: unknown): string | number {
  if (typeof item === "object" && item !== null && "id" in item) {
    const id = (item as Record<string, unknown>).id;
    if (typeof id === "number" || typeof id === "string") return id;
  }
  return "unknown";
}

/**
 * Compute W/D/L summary for a list of matches.
 * Only finished matches (with goals set) contribute to the summary.
 * `is_home` determines which side's score is "ours".
 */
function computeOpponentSummary(
  matches: readonly Match[],
): OpponentHistory["summary"] {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const m of matches) {
    const homeScore = m.home_team.score;
    const awayScore = m.away_team.score;
    if (homeScore == null || awayScore == null) continue; // not finished
    if (m.is_home == null) continue; // can't determine result

    const kcvvGoals = m.is_home ? homeScore : awayScore;
    const opponentGoals = m.is_home ? awayScore : homeScore;

    goalsFor += kcvvGoals;
    goalsAgainst += opponentGoals;

    if (kcvvGoals > opponentGoals) wins++;
    else if (kcvvGoals < opponentGoals) losses++;
    else draws++;
  }

  return { wins, draws, losses, goalsFor, goalsAgainst };
}

// ─── Service definition ────────────────────────────────────────────────────────

export interface FootbalistoServiceInterface {
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
}

export class FootbalistoService extends Context.Tag("FootbalistoService")<
  FootbalistoService,
  FootbalistoServiceInterface
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

export const FootbalistoServiceLive = Layer.effect(
  FootbalistoService,
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

    /** Convert a PsdGame date + time fields to UTC milliseconds */
    const toMs = (m: PsdGame): number => {
      const datePart = m.date.split(" ")[0]!;
      const timeStr = m.time ?? m.date.split(" ")[1] ?? "00:00";
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour = 0, minute = 0] = timeStr.split(":").map(Number);
      return Date.UTC(year!, month! - 1, day!, hour, minute);
    };

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

          return yield* Effect.forEach(games, (game) =>
            transformPsdGame({ ...game, teamId: game.teamId ?? teamId }),
          );
        }),

      getNextMatches: () =>
        Effect.gen(function* () {
          const visiblePsdIds = yield* getVisibleTeamIds();
          const teams = yield* countedFetch(`${base}/teams`, PsdTeamsArray);
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
                      .filter((m) => toMs(m) >= now)
                      .sort((a, b) => toMs(a) - toMs(b))[0];
                    return next
                      ? yield* transformPsdGame({ ...next, teamId: team.id })
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
          Effect.flatMap(transformFootbalistoMatchDetail),
          Effect.map(matchDetailToMatch),
        ),

      getMatchDetail: (matchId: number) =>
        fetchRawMatchDetail(matchId).pipe(
          Effect.flatMap(transformFootbalistoMatchDetail),
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

          return competition.teams.map((e) =>
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
                    return yield* Effect.forEach(games, (g) =>
                      transformPsdGame({ ...g, teamId }),
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

          if (opponentMatches.length === 0) {
            return yield* Effect.fail(
              new ResourceNotFoundError({
                message: `No matches found against club ${clubId} for team ${teamId}`,
                resourceType: "opponent-history",
                resourceId: String(clubId),
              }),
            );
          }

          // Derive opponent info from the first match containing club
          const firstMatch = opponentMatches[0]!;
          const opponentClub =
            firstMatch.home_team.id === clubId
              ? firstMatch.home_team
              : firstMatch.away_team;

          const summary = computeOpponentSummary(opponentMatches);

          // Sort descending by date (most recent first)
          const sortedMatches = [...opponentMatches].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

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
    };
  }),
);
