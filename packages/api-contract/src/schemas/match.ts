import { Schema as S } from "effect";
import { DateFromStringOrDate } from "./common";

/** Team info in a normalized match */
export class MatchTeam extends S.Class<MatchTeam>("MatchTeam")({
  id: S.Number,
  name: S.String,
  logo: S.optional(S.String),
  score: S.optional(S.Number),
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
/**
 * Canonical runtime tuple of all MatchStatus literals — single source of truth.
 * Use this for Storybook argTypes, parameterized tests, or anywhere a runtime
 * iterable is needed. The type is derived from this tuple.
 */
export const MATCH_STATUS_VALUES = [
  "scheduled",
  "finished",
  "forfeited",
  "postponed",
  "cancelled",
  "stopped",
] as const;

export const MatchStatus = S.Literal(...MATCH_STATUS_VALUES);
export type MatchStatus = S.Schema.Type<typeof MatchStatus>;

/** Shared fields between Match and MatchDetail */
const BaseMatchFields = {
  id: S.Number,
  date: DateFromStringOrDate,
  time: S.optional(S.String),
  venue: S.optional(S.String),
  home_team: MatchTeam,
  away_team: MatchTeam,
  status: MatchStatus,
  squadLabel: S.optional(S.String),
  competition: S.optional(S.String),
  /** PSD team ID identifying which KCVV team plays (A-team, B-team, U21, etc.) */
  kcvv_team_id: S.optional(S.Number),
  /** Human-readable label for the KCVV team (e.g. "A-Ploeg", "U21") */
  kcvv_team_label: S.optional(S.String),
  /** Whether the KCVV team is playing at home. Computed by BFF from homeTeamId === teamId. */
  is_home: S.optional(S.Boolean),
};

/** Normalized match for UI consumption */
export class Match extends S.Class<Match>("Match")(BaseMatchFields) {}

export const MatchesArray = S.Array(Match);

export class MatchesResponse extends S.Class<MatchesResponse>("MatchesResponse")({
  matches: MatchesArray,
  total: S.optional(S.Number),
}) {}

/** Card type for match events */
export const CardType = S.Literal("yellow", "red", "double_yellow");
export type CardType = S.Schema.Type<typeof CardType>;

/** Normalized lineup player for UI consumption */
export class MatchLineupPlayer extends S.Class<MatchLineupPlayer>("MatchLineupPlayer")({
  id: S.optional(S.Number),
  name: S.String,
  number: S.optional(S.Number),
  minutesPlayed: S.optional(S.Number),
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
  id: S.Number,
  type: MatchEventType,
  minute: S.Number,
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
