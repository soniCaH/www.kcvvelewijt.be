import { Schema as S } from "effect";
import type {
  Match,
  MatchDetail,
  MatchLineupPlayer,
  RankingEntry,
  CardType,
  CompetitionType,
  OpponentHistory,
  MatchEvent,
} from "@kcvv/api-contract";
import {
  PsdGame,
  type PsdCompetition,
  type PsdCompetitionType,
  FootbalistoLineupPlayer,
  FootbalistoMatchEvent,
  type FootbalistoMatchDetailResponse as RawDetailResponse,
  FootbalistoRankingEntry,
  FootbalistoClub,
} from "./schemas";
import { resolveVenue } from "./venue";

// ─── Competition label helpers ────────────────────────────────────────────────

export function mapCompetitionLabel(
  type: string,
  name?: string | null,
): string {
  if (name?.trim()) return name.trim();
  switch (type.toUpperCase()) {
    case "LEAGUE":
    case "OFFICIAL":
      return "Competitie";
    case "CUP":
      return "Beker";
    case "FRIENDLY":
      return "Vriendschappelijk";
    case "TOURNAMENT":
      return "Tornooi";
    case "INTERNATIONAL":
      return "Internationaal";
    default:
      return type;
  }
}

/** Map of PSD competition id → specific Dutch label (e.g. 9 → "Beker van Brabant"). */
export type CompetitionLabelMap = Record<number, string>;

/** Pick the Dutch (or Flemish) label value from a competition's translations. */
function pickDutchLabel(
  translations: PsdCompetition["labelTranslations"],
): string | undefined {
  if (!translations) return undefined;
  const nl = translations.find((t) => t.language === "nl");
  const vls = translations.find((t) => t.language === "vls");
  const value = (nl ?? vls)?.value?.trim();
  return value || undefined;
}

/**
 * Build a competition-id → Dutch-label map from the /competitions response.
 * The specific name lives in `labelTranslations` (the top-level `name` is null
 * for cups); fall back to `name` when no translation is present.
 */
export function buildCompetitionLabelMap(
  competitions: readonly PsdCompetition[],
): CompetitionLabelMap {
  const map: CompetitionLabelMap = {};
  for (const c of competitions) {
    const label = pickDutchLabel(c.labelTranslations) ?? c.name?.trim();
    if (label) map[c.id] = label;
  }
  return map;
}

/**
 * Resolve a PSD competitionType field (object, plain string, or null/undefined)
 * to a Dutch display label. Returns undefined when no competition info is available.
 *
 * Needed because:
 * - /games/team/{id}/seasons/{id} returns an object { id, name, type }; for cups
 *   `name` is null, so the specific name ("Beker van Brabant") is resolved from
 *   `competitionLabels` (built from /competitions) keyed by the competition id.
 * - /games/{id}/info already inlines the resolved string (e.g. "Croky Cup").
 * - Both endpoints may return null when no competition is assigned.
 *
 * Note: `typeof null === "object"` in JavaScript, so a null check must come
 * before the typeof guard.
 */
function resolveCompetitionLabel(
  ct: PsdCompetitionType | string | null | undefined,
  competitionLabels?: CompetitionLabelMap,
): string | undefined {
  if (ct == null) return undefined;
  if (typeof ct === "string") return mapCompetitionLabel(ct, undefined);
  const specific = competitionLabels?.[ct.id];
  if (specific) return specific;
  return mapCompetitionLabel(ct.type ?? "UNKNOWN", ct.name);
}

/**
 * Resolve a PSD competitionType field to the normalized
 * league/cup/friendly/tournament classification used by the UI gate (e.g.
 * match-day standings).
 *
 * Only the **object** form carries a reliable `.type`. The match-detail
 * endpoint (`/games/{id}/info`) inlines a display *string* (e.g. "Croky Cup"),
 * which can't be classified without string-matching Dutch labels (banned) — so
 * the string and null forms fall through to `"other"`. The match-detail page
 * therefore sources a reliable type from the season-games object form via the
 * match-team index, not from `/games/{id}/info` directly.
 *
 * PSD uses `type: "OFFICIAL"` (Dutch "Competitie") for league play; `"LEAGUE"`
 * is accepted as a forward-compat synonym. `"TOURNAMENT"` resolves to
 * `"tournament"`; any other code (e.g. `"INTERNATIONAL"`) has no member of
 * its own and falls through to `"other"`.
 */
export function resolveCompetitionType(
  ct: PsdCompetitionType | string | null | undefined,
): CompetitionType {
  if (ct == null || typeof ct === "string") return "other";
  switch (ct.type.toUpperCase()) {
    case "OFFICIAL":
    case "LEAGUE":
      return "league";
    case "CUP":
      return "cup";
    case "FRIENDLY":
      return "friendly";
    case "TOURNAMENT":
      return "tournament";
    default:
      return "other";
  }
}

/**
 * Derive the display team designation for a match side from PSD's per-game
 * `homeTeam`/`awayTeam` code. Opponents carry an alpha designation ("A", "B",
 * "U21", "U23"); the queried club's own side carries its numeric team id
 * ("1", "2", "21"), which has no display value. Returns undefined for empty or
 * purely-numeric codes so only meaningful opponent labels surface.
 */
export function deriveMatchTeamLabel(
  code: string | null | undefined,
): string | undefined {
  if (code == null) return undefined;
  const trimmed = code.trim();
  if (trimmed === "" || /^\d+$/.test(trimmed)) return undefined;
  return trimmed;
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

// ─── Club name casing ────────────────────────────────────────────────────────

/**
 * Federation prefixes PSD returns title-cased ("Ksc Blankenberge"), losing their
 * capitals. Matched case-insensitively against every token, so a prefix is
 * restored wherever it sits ("Yellow Red Kv Mechelen", "Peutie Fc").
 */
const CLUB_ABBREVIATIONS = new Set([
  "AC",
  "AS",
  "EWS",
  "FC",
  "K",
  "KA",
  "KAA",
  "KC",
  "KCS",
  "KCVV",
  "KFC",
  "KSC",
  "KSK",
  "KSV",
  "KV",
  "KVC",
  "KVE",
  "KVK",
  "KVV",
  "KVW",
  "KWS",
  "MVC",
  "RC",
  "SC",
  "SK",
  "SP",
  "TSV",
  "US",
  "VC",
  "VK",
  "VV",
  "VW",
]);

/**
 * Legacy PSD spelling of our own club, letter-spaced ("K c v v Elewijt"). The
 * token pass cannot reach it — each letter is its own token.
 */
const SPACED_KCVV = /\bk\s+c\s+v\s+v\b/gi;

/**
 * Restore casing PSD flattens: `"Ksc Blankenberge"` → `"KSC Blankenberge"`,
 * `"Erpe-mere"` → `"Erpe-Mere"`, `"Kcvv Elewijt"` → `"KCVV Elewijt"` (#2336).
 *
 * Applied at every club-name emission site rather than at decode time — decoding
 * would also rewrite player names, competition labels, and any future name-ish
 * field, for no extra coverage. Idempotent, so an already-correct `localName`
 * passes through untouched.
 */
export function normaliseClubName(name: string): string {
  return name
    .replace(SPACED_KCVV, "KCVV")
    .split(" ")
    .map((token) => {
      const upper = token.toUpperCase();
      if (CLUB_ABBREVIATIONS.has(upper)) return upper;
      if (token.includes("-")) {
        return token
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("-");
      }
      return token;
    })
    .join(" ");
}

/**
 * Build a match-side team from a PSD club. Every club name that reaches a match
 * payload passes through here, so casing is normalised **by construction** — a
 * new match transform cannot forget to call `normaliseClubName` (#2336).
 */
function toMatchTeam(
  club: FootbalistoClub,
  score: number | null | undefined,
  teamLabel?: string,
): Match["home_team"] {
  return {
    id: club.id,
    name: normaliseClubName(club.name),
    logo: club.logo ?? undefined,
    score: score ?? undefined,
    team_label: teamLabel,
  };
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
 * The `cancelled` boolean takes full precedence — if true, status is always "cancelled"
 * regardless of the numeric code. "cancelled" is distinct from "postponed":
 * cancelled matches will not be played, postponed matches (PSD code 2) may be rescheduled.
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
  if (cancelled) return "cancelled";
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

/**
 * A settled result — the match has a final outcome (played to completion or
 * forfeited), as opposed to scheduled / postponed / stopped / cancelled.
 */
export function isSettledMatchStatus(status: string): boolean {
  return status === "finished" || status === "forfeited";
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

/**
 * Whether a fixture is a pitch-reservation placeholder — both sides are the
 * same club, guarded so both ids being null/undefined does not collide into
 * "true". Full semantics (including the accepted A-vs-B false positive) are
 * documented once, on `is_placeholder` in
 * `packages/api-contract/src/schemas/match.ts`.
 */
export function isSelfMatch(
  homeClubId: number | null | undefined,
  awayClubId: number | null | undefined,
): boolean {
  return homeClubId != null && awayClubId != null && homeClubId === awayClubId;
}

// ─── PSD Game → Match ─────────────────────────────────────────────────────────

export function transformPsdGame(
  game: PsdGame,
  options?: { ownClubId?: number; competitionLabels?: CompetitionLabelMap },
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

  const competitionType = resolveCompetitionType(game.competitionType);
  const isPlaceholder = isSelfMatch(game.homeClub.id, game.awayClub.id);

  return {
    id: game.id,
    date: matchDate,
    time: timePart,
    // Sourced from `resolveVenue` (#2491), not a second, home-only literal —
    // see that module's doc for the `isHome === true` + real-fixture guard.
    // Costs ~46 bytes on the roughly half of every KV-cached payload that is
    // a home fixture — judged worth it, unlike the bare `is_home` boolean
    // dropped below, because the string itself carries information a reader
    // needs.
    venue: resolveVenue(isHome, {
      isPlaceholder,
      competitionType,
      status,
      homeScore: game.goalsHomeTeam ?? undefined,
      awayScore: game.goalsAwayTeam ?? undefined,
    }),
    home_team: toMatchTeam(
      game.homeClub,
      game.goalsHomeTeam,
      deriveMatchTeamLabel(game.homeTeam),
    ),
    away_team: toMatchTeam(
      game.awayClub,
      game.goalsAwayTeam,
      deriveMatchTeamLabel(game.awayTeam),
    ),
    status,
    competition: resolveCompetitionLabel(
      game.competitionType,
      options?.competitionLabels,
    ),
    // Normalized league/cup/friendly classification — the season-games object
    // form carries a reliable `.type`, so this is the canonical league gate for
    // list consumers (the `competition` label is a division name, not "Competitie").
    competitionType,
    kcvv_team_id: game.teamId ?? undefined,
    is_home: isHome,
    // `|| undefined`, not the bare boolean: this is `false` for ~99.9% of
    // matches, and JSON.stringify drops an `undefined` key entirely —
    // sparing every KV-cached payload (getTeamMatches / getMatchesWindow /
    // getOpponentHistory) that byte on write, on read-parse, and on every
    // response. `is_home`'s sibling field already models "not applicable"
    // as `undefined`, and the web side reads `=== true`, so `undefined` and
    // `false` are indistinguishable downstream.
    is_placeholder: isPlaceholder || undefined,
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
    // `0` is not a number (#2532 decision rule 5, #2585): PSD sends 0 for
    // "not recorded" on the match sheet, not a real shirt number. `??`
    // alone only catches `null`/`undefined` and lets 0 straight through —
    // the truthiness check below also folds that case to `undefined`.
    number: player.number ? player.number : undefined,
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
    // Map PSD card subtypes onto the normalised MatchEventType set. A 2nd
    // yellow used to collapse into `red_card` here; #1908 (Phase 6.B) split
    // it out so UI surfaces can ship a distinct stacked-card glyph.
    const type: MatchEvent["type"] =
      cardType === "double_yellow"
        ? "second_yellow"
        : cardType === "red"
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
    { home: MatchLineupPlayer[]; away: MatchLineupPlayer[] } | undefined;
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
    home_team: toMatchTeam(general.homeClub, general.goalsHomeTeam),
    away_team: toMatchTeam(general.awayClub, general.goalsAwayTeam),
    status,
    competition: resolveCompetitionLabel(general.competitionType),
    lineup,
    events,
    hasReport: general.viewGameReport ?? false,
    // Unlike `is_home`, this needs no team context to resolve — the detail
    // endpoint already carries both club ids. `|| undefined` for the same
    // sparse-JSON reason as `transformPsdGame`'s.
    is_placeholder:
      isSelfMatch(general.homeClub.id, general.awayClub.id) || undefined,
  };
}

// ─── Ranking transforms ──────────────────────────────────────────────────────

/**
 * Strip the federation's bookkeeping off a competition name — the leading
 * `Voetbal : <bond> - ` and a trailing ` - Hommes` / ` - Femmes` (#2589).
 *
 * Returns the input **unchanged** when neither pattern matches. The name is a
 * federation string with no contract behind it, so the helper never blanks a
 * name it does not recognise and never invents one.
 */
export function stripPsdName(name: string): string {
  const stripped = name
    .replace(/^Voetbal\s*:\s*[^-]*-\s*/, "")
    .replace(/\s*-\s*(?:Hommes|Femmes)$/, "");
  return stripped.length > 0 ? stripped : name;
}

export function transformFootbalistoRankingEntry(
  entry: FootbalistoRankingEntry,
  logoCdnUrl: string,
): RankingEntry {
  const cdn = logoCdnUrl.replace(/\/+$/, "");
  // Normalise the RESOLVED value — `localName` is usually already correct, but
  // the `name` fallback carries PSD's flattened casing.
  const teamName = normaliseClubName(
    entry.team.club.localName || entry.team.club.name || "Unknown Team",
  );
  return {
    position: entry.rank,
    team_id: entry.team.id,
    club_id: entry.team.club.id,
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
