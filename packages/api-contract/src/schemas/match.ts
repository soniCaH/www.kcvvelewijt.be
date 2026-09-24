import { Schema as S } from "effect";
import { DateFromStringOrDate } from "./common";

/** Team info in a normalized match */
export class MatchTeam extends S.Class<MatchTeam>("MatchTeam")({
  id: S.Finite,
  name: S.String,
  logo: S.optional(S.String),
  score: S.optional(S.Finite),
  /**
   * Team designation within the club (e.g. "A", "B", "U23") derived from PSD's
   * per-game `homeTeam`/`awayTeam` codes. Present mainly for opponents that
   * field a non-first team; omitted for the club's own numeric squad code
   * (PSD labels the queried team with its numeric id, which carries no display
   * value). Computed by the BFF — see `deriveMatchTeamLabel`.
   */
  team_label: S.optional(S.String),
}) {}

/**
 * Normalized match status derived from PSD numeric status codes:
 *   0 (no goals) → "scheduled"
 *   0 (has goals) → "finished"
 *   1 (FF)        → "forfeited"
 *   2 (AFG)       → "postponed"  (afgelast — may be rescheduled)
 *   3 (STOP)      → "stopped"    (ended prematurely — may be rescheduled)
 *
 * Override: if PSD's `cancelled` boolean is true, status is always "cancelled"
 * regardless of the numeric code (the flag takes full precedence over 0/1/2/3).
 * "cancelled" is distinct from "postponed": cancelled matches will not be played,
 * postponed matches may be rescheduled.
 */
const MATCH_STATUS_VALUES = [
  "scheduled",
  "finished",
  "forfeited",
  "postponed",
  "cancelled",
  "stopped",
] as const;

export const MatchStatus = S.Literal(...MATCH_STATUS_VALUES);
export type MatchStatus = S.Schema.Type<typeof MatchStatus>;

/**
 * Normalized league/cup/friendly/tournament classification for a match.
 *
 * Surfaced so consumers can gate behaviour on the *structured* competition type
 * instead of string-matching the Dutch `competition` label (which is a division
 * name like "3de Nationale", not "Competitie"). Derived by the BFF from PSD's
 * `competitionType.type` (`OFFICIAL`/`LEAGUE` → `"league"`, `CUP` → `"cup"`,
 * `FRIENDLY` → `"friendly"`, `TOURNAMENT` → `"tournament"`, anything else →
 * `"other"`).
 */
export const CompetitionType = S.Literal("league", "cup", "friendly", "tournament", "other");
export type CompetitionType = S.Schema.Type<typeof CompetitionType>;

/** Shared fields between Match and MatchDetail */
const BaseMatchFields = {
  id: S.Finite,
  date: DateFromStringOrDate,
  time: S.optional(S.String),
  venue: S.optional(S.String),
  home_team: MatchTeam,
  away_team: MatchTeam,
  status: MatchStatus,
  squadLabel: S.optional(S.String),
  competition: S.optional(S.String),
  /** League/cup/friendly classification. Absent when the BFF can't resolve it. */
  competitionType: S.optional(CompetitionType),
  /** PSD team ID identifying which KCVV team plays (A-team, B-team, U21, etc.) */
  kcvv_team_id: S.optional(S.Finite),
  /** Human-readable label for the KCVV team (e.g. "A-Ploeg", "U21") */
  kcvv_team_label: S.optional(S.String),
  /** Whether the KCVV team is playing at home. Computed by BFF from homeTeamId === teamId. */
  is_home: S.optional(S.Boolean),
  /**
   * Whether this fixture is a pitch-reservation placeholder — both sides are
   * the same club (#2606). The club enters these deliberately, meaning "this
   * team has something that day, the details aren't settled", and uses the
   * same device for external tournaments too. **Not derivable from
   * `competitionType`** — a self-match can be a `TOURNAMENT` or a `FRIENDLY`
   * entry, and an ordinary tournament fixture with a real opponent carries
   * the same `competitionType` without being a placeholder. Computed by the
   * BFF from `homeClubId === awayClubId`, guarded so both ids being absent
   * does not read as a placeholder.
   *
   * Accepted false positive: a genuine internal fixture (KCVV A vs KCVV B)
   * also satisfies `homeClubId === awayClubId` and would render as a
   * placeholder too. The AC mandates the rule be computed from club-id
   * equality alone, forbidding any exception for whose tournament it is,
   * and #2606's census found no such row in production — so this is
   * accepted, not a bug to design around.
   */
  is_placeholder: S.optional(S.Boolean),
};

/** Normalized match for UI consumption */
export class Match extends S.Class<Match>("Match")(BaseMatchFields) {}

export const MatchesArray = S.Array(Match);

export class MatchesResponse extends S.Class<MatchesResponse>("MatchesResponse")({
  matches: MatchesArray,
  total: S.optional(S.Finite),
}) {}

/** Card type for match events */
export const CardType = S.Literal("yellow", "red", "double_yellow");
export type CardType = S.Schema.Type<typeof CardType>;

/** Normalized lineup player for UI consumption */
export class MatchLineupPlayer extends S.Class<MatchLineupPlayer>("MatchLineupPlayer")({
  id: S.optional(S.Finite),
  name: S.String,
  number: S.optional(S.Finite),
  minutesPlayed: S.optional(S.Finite),
  isCaptain: S.Boolean,
  isKeeper: S.optional(S.Boolean),
  position: S.optional(S.String),
  status: S.Literal("starter", "substitute", "substituted", "subbed_in", "unknown"),
  card: S.optional(CardType),
}) {}

/** Normalized match lineup for UI consumption */
export class MatchLineup extends S.Class<MatchLineup>("MatchLineup")({
  home: S.Array(MatchLineupPlayer),
  away: S.Array(MatchLineupPlayer),
}) {}

/**
 * Event type for match events.
 *
 * `second_yellow` is distinct from `red_card`: a second yellow card during
 * a match still ends in a red, but reads differently to a fan and ships a
 * distinct stacked-card glyph in the UI. The BFF maps PSD's
 * `subtype: "double_yellow"` to this value; a direct red still maps to
 * `red_card`.
 */
export const MatchEventType = S.Literal(
  "goal",
  "yellow_card",
  "second_yellow",
  "red_card",
  "substitution",
);
export type MatchEventType = S.Schema.Type<typeof MatchEventType>;

/** Normalized match event for UI consumption */
export class MatchEvent extends S.Class<MatchEvent>("MatchEvent")({
  id: S.Finite,
  type: MatchEventType,
  minute: S.Finite,
  team: S.Literal("home", "away"),
  player: S.optional(S.String),
  playerIn: S.optional(S.String),
  playerOut: S.optional(S.String),
  isPenalty: S.optional(S.Boolean),
  isOwnGoal: S.optional(S.Boolean),
}) {}

/** Normalized match detail (extended Match with lineup and events) */
export class MatchDetail extends S.Class<MatchDetail>("MatchDetail")({
  ...BaseMatchFields,
  lineup: S.optional(MatchLineup),
  events: S.optional(S.Array(MatchEvent)),
  hasReport: S.Boolean,
}) {}
