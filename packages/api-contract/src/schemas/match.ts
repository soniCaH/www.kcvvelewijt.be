import { Schema as S } from "effect";
import { DateFromStringOrDate } from "./common";

/** Team info in a normalized match */
export class MatchTeam extends S.Class<MatchTeam>("MatchTeam")({
  id: S.Number,
  name: S.String,
  logo: S.optional(S.String),
  score: S.optional(S.Number),
}) {}

/**
 * Normalized match status derived from PSD numeric status codes:
 *   0 (no goals) → "scheduled"
 *   0 (has goals) → "finished"
 *   1 (FF)        → "forfeited"
 *   2 (AFG)       → "postponed"  (afgelast — may be rescheduled)
 *   3 (STOP)      → "stopped"    (ended prematurely — may be rescheduled)
 */
export const MatchStatus = S.Literal(
  "scheduled",
  "finished",
  "forfeited",
  "postponed",
  "stopped",
);
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
  round: S.optional(S.String),
  competition: S.optional(S.String),
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

/** Normalized match detail (extended Match with lineup) */
export class MatchDetail extends S.Class<MatchDetail>("MatchDetail")({
  ...BaseMatchFields,
  lineup: S.optional(MatchLineup),
  hasReport: S.Boolean,
}) {}
