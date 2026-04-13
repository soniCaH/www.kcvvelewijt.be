import { Schema as S } from "effect";
import type {
  Match,
  MatchDetail,
  MatchLineupPlayer,
  RankingEntry,
  CardType,
  OpponentHistory,
  MatchEvent,
} from "@kcvv/api-contract";
import {
  PsdGame,
  type PsdCompetitionType,
  FootbalistoLineupPlayer,
  FootbalistoMatchEvent,
  type FootbalistoMatchDetailResponse as RawDetailResponse,
  FootbalistoRankingEntry,
} from "./schemas";

// ─── Competition label helpers ────────────────────────────────────────────────

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
      return name?.trim() || type;
  }
}

/**
 * Resolve a PSD competitionType field (object, plain string, or null/undefined)
 * to a Dutch display label. Returns undefined when no competition info is available.
 *
 * Needed because:
 * - /games/team/{id}/seasons/{id} returns an object { id, name, type }
 * - /match/{id}/general sometimes returns a plain string (e.g. "Competitie")
 * - Both endpoints may return null when no competition is assigned
 *
 * Note: `typeof null === "object"` in JavaScript, so a null check must come
 * before the typeof guard.
 */
function resolveCompetitionLabel(
  ct: PsdCompetitionType | string | null | undefined,
): string | undefined {
  if (ct == null) return undefined;
  if (typeof ct === "string") return mapCompetitionLabel(ct, undefined);
  return mapCompetitionLabel(ct.type ?? "UNKNOWN", ct.name);
}

// ─── Team label helpers ───────────────────────────────────────────────────────

/**
 * Derive a human-readable team label from PSD team name and age group.
 *
 * Youth teams (age !== "A"): use the age directly (e.g. "U21", "U17").
 * Senior teams (age === "A"): check if name ends with " B" → "B-Ploeg", else "A-Ploeg".
 */
export function derivePsdTeamLabel(name: string, age: string): string {
  if (age !== "A") return age;
  return name.endsWith(" B") ? "B-Ploeg" : "A-Ploeg";
}

// ─── Game status mapping ──────────────────────────────────────────────────────

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
 * regardless of the numeric code.
 * Any unknown code (when not cancelled) falls back to "scheduled" (safe default).
 * This is a pure function — callers that need to detect unknown codes for logging
 * can use {@link isUnknownGameStatus}.
 */
export function mapGameStatus(
  status: number,
  goalsHome: number | null,
  goalsAway: number | null,
  cancelled?: boolean | null,
): Match["status"] {
  if (cancelled) return "postponed";
  if (status === 1) return "forfeited";
  if (status === 2) return "postponed";
  if (status === 3) return "stopped";
  if (status === 0) {
    return goalsHome !== null && goalsAway !== null ? "finished" : "scheduled";
  }
  return "scheduled";
}

/** Returns true when the PSD status code is not one of the known values (0–3). */
export function isUnknownGameStatus(status: number): boolean {
  return status !== 0 && status !== 1 && status !== 2 && status !== 3;
}

// ─── Date parsing ─────────────────────────────────────────────────────────────

function parseDateString(dateStr: string): { date: Date; time: string } {
  const [datePart, timePart = "00:00"] = dateStr.split(" ");
  const [year, month, day] = datePart!.split("-").map(Number);
  const [hour = 0, minute = 0] = timePart.split(":").map(Number);
  if ([year, month, day].some((n) => n == null || isNaN(n))) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }
  if (
    month! < 1 ||
    month! > 12 ||
    day! < 1 ||
    hour! < 0 ||
    hour! > 23 ||
    minute! < 0 ||
    minute! > 59
  ) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }
  const date = new Date(Date.UTC(year!, month! - 1, day!, hour, minute));
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }
  if (
    date.getUTCFullYear() !== year! ||
    date.getUTCMonth() + 1 !== month! ||
    date.getUTCDate() !== day! ||
    date.getUTCHours() !== hour! ||
    date.getUTCMinutes() !== minute!
  ) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }
  return { date, time: timePart };
}

/** Convert a PsdGame date + time fields to UTC milliseconds (for sorting). */
export function psdGameToMs(m: PsdGame): number {
  const datePart = m.date.split(" ")[0]!;
  const timeStr = m.time ?? m.date.split(" ")[1] ?? "00:00";
  return parseDateString(`${datePart} ${timeStr}`).date.getTime();
}

/**
 * Derive the club ID that owns the queried team from a set of games.
 *
 * Across a season, the team's club appears as homeClub or awayClub in every
 * game while the opponent changes. Comparing the first two games identifies
 * the common club ID.
 *
 * Returns undefined when fewer than 2 games are available (can't distinguish).
 */
export function deriveOwnClubId(games: PsdGame[]): number | undefined {
  if (games.length < 2) return undefined;
  const first = games[0]!;
  const second = games[1]!;
  const candidateA = first.homeClub.id;
  // If candidateA appears in the second game (home or away), it's the own club
  if (second.homeClub.id === candidateA || second.awayClub.id === candidateA) {
    return candidateA;
  }
  // Otherwise the away club of the first game must be the own club
  return first.awayClub.id;
}

// ─── PSD Game → Match ─────────────────────────────────────────────────────────

export function transformPsdGame(
  game: PsdGame,
  options?: { ownClubId?: number },
): Match {
  const datePart = game.date.split(" ")[0]!;
  const timeStr = game.time ?? game.date.split(" ")[1] ?? "00:00";
  const { date: matchDate, time: timePart } = parseDateString(
    `${datePart} ${timeStr}`,
  );

  // Primary: use homeTeamId (undocumented PSD field, not always present)
  // Fallback: use club ID comparison when ownClubId is known
  const isHome =
    game.homeTeamId != null && game.teamId != null
      ? game.homeTeamId === game.teamId
      : options?.ownClubId != null
        ? game.homeClub.id === options.ownClubId
        : undefined;

  const status = mapGameStatus(
    game.status,
    game.goalsHomeTeam,
    game.goalsAwayTeam,
    game.cancelled,
  );

  return {
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
    competition: resolveCompetitionLabel(game.competitionType),
    kcvv_team_id: game.teamId ?? undefined,
    is_home: isHome,
  };
}

// ─── Lineup transforms ───────────────────────────────────────────────────────

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

// ─── Card parsing ─────────────────────────────────────────────────────────────

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

// ─── Match event transforms ──────────────────────────────────────────────────

function transformMatchEvent(
  event: FootbalistoMatchEvent,
  index: number,
  homeClubId: number,
  awayClubId: number,
): MatchEvent | null {
  const actionType = event.action.type.toUpperCase();
  const subtype = event.action.subtype?.toLowerCase() ?? null;
  const minute = event.minute;

  if (minute == null) return null;

  const team: "home" | "away" | null =
    event.clubId === homeClubId
      ? "home"
      : event.clubId === awayClubId
        ? "away"
        : null; // clubId unknown — skip event

  if (team === null) return null;

  const id = event.action.id ?? index;

  if (actionType === "GOAL") {
    const isPenalty = subtype === "penalty" || subtype === "strafschop";
    const isOwnGoal =
      subtype === "own_goal" || subtype === "owngoal" || subtype === "eigen";
    return {
      id,
      type: "goal",
      minute,
      team,
      player: event.playerName ?? undefined,
      isPenalty,
      isOwnGoal,
    };
  }

  if (actionType === "CARD") {
    const cardType = parseCardType(event);
    if (!cardType) return null;
    const type: MatchEvent["type"] =
      cardType === "red" || cardType === "double_yellow"
        ? "red_card"
        : "yellow_card";
    return {
      id,
      type,
      minute,
      team,
      player: event.playerName ?? undefined,
    };
  }

  if (actionType === "SUBSTITUTION") {
    return {
      id,
      type: "substitution",
      minute,
      team,
      playerOut: event.playerName ?? undefined,
    };
  }

  return null;
}

// ─── Match detail transforms ─────────────────────────────────────────────────

function transformPlayerWithCard(
  player: FootbalistoLineupPlayer,
  cardMap: Map<number, CardType> | null,
): MatchLineupPlayer {
  const base = transformLineupPlayer(player);
  const card = cardMap && base.id != null ? cardMap.get(base.id) : undefined;
  return card ? { ...base, card } : base;
}

/** Decode items individually, filtering out any that fail schema validation. */
function decodeItemsSync<A, I>(
  schema: S.Schema<A, I>,
  items: readonly unknown[],
): A[] {
  const decode = S.decodeUnknownSync(schema);
  const valid: A[] = [];
  for (const item of items) {
    try {
      valid.push(decode(item));
    } catch {
      // skip invalid items — caller can compare input/output length to detect filtered items
    }
  }
  return valid;
}

export function transformFootbalistoMatchDetail(
  response: RawDetailResponse,
): MatchDetail {
  const general = response.general;
  const { date: matchDate, time: timePart } = parseDateString(general.date);

  // Resilient event decoding — invalid items are filtered, valid ones pass through
  const validEvents = response.events
    ? decodeItemsSync(FootbalistoMatchEvent, response.events)
    : [];

  const cardMap =
    validEvents.length > 0 ? buildPlayerCardMap(validEvents) : null;

  // Resilient lineup decoding — invalid players are filtered, valid ones pass through
  let lineup:
    | { home: MatchLineupPlayer[]; away: MatchLineupPlayer[] }
    | undefined;
  if (response.lineup || response.substitutes) {
    const rawHome = [
      ...(response.lineup?.home ?? []),
      ...(response.substitutes?.home ?? []),
    ];
    const rawAway = [
      ...(response.lineup?.away ?? []),
      ...(response.substitutes?.away ?? []),
    ];

    const homePlayers = decodeItemsSync(FootbalistoLineupPlayer, rawHome);
    const awayPlayers = decodeItemsSync(FootbalistoLineupPlayer, rawAway);

    lineup = {
      home: homePlayers.map((p) => transformPlayerWithCard(p, cardMap)),
      away: awayPlayers.map((p) => transformPlayerWithCard(p, cardMap)),
    };
  }

  let events: MatchEvent[] | undefined;
  if (validEvents.length > 0) {
    const transformed = validEvents
      .map((e, i) =>
        transformMatchEvent(e, i, general.homeClub.id, general.awayClub.id),
      )
      .filter((e): e is MatchEvent => e !== null);
    events = transformed.length > 0 ? transformed : undefined;
  }

  const status = mapGameStatus(
    general.status,
    general.goalsHomeTeam,
    general.goalsAwayTeam,
    general.cancelled,
  );

  return {
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
    competition: resolveCompetitionLabel(general.competitionType),
    lineup,
    events,
    hasReport: general.viewGameReport ?? false,
  };
}

// ─── Ranking transforms ──────────────────────────────────────────────────────

/** Strip lineup from a MatchDetail to produce a basic Match */
export function matchDetailToMatch(detail: MatchDetail): Match {
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

export function transformFootbalistoRankingEntry(
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

// ─── Utility helpers ─────────────────────────────────────────────────────────

/** Safely extract an `id` field from an unknown item for logging. */
export function extractId(item: unknown): string | number {
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
export function computeOpponentSummary(
  matches: readonly Match[],
): OpponentHistory["summary"] {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const m of matches) {
    if (m.status !== "finished") continue; // only count truly finished matches
    const homeScore = m.home_team.score;
    const awayScore = m.away_team.score;
    if (homeScore == null || awayScore == null) continue;
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
