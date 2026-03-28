/**
 * Raw Footbalisto API schemas — BFF implementation details only.
 * Normalized types (Match, MatchDetail, etc.) come from @kcvv/api-contract.
 */
import { Schema as S } from "effect";

export class FootbalistoClub extends S.Class<FootbalistoClub>(
  "FootbalistoClub",
)({
  id: S.Number,
  name: S.String,
  logo: S.optional(S.NullOr(S.String)),
  abbreviation: S.optional(S.NullOr(S.String)),
  logoSmall: S.optional(S.NullOr(S.String)),
  version: S.optional(S.NullOr(S.Number)),
}) {}

export class FootbalistoRankingClub extends S.Class<FootbalistoRankingClub>(
  "FootbalistoRankingClub",
)({
  id: S.Number,
  localName: S.NullOr(S.String),
  name: S.NullOr(S.String),
}) {}

export class FootbalistoRankingTeam extends S.Class<FootbalistoRankingTeam>(
  "FootbalistoRankingTeam",
)({
  id: S.Number,
  club: FootbalistoRankingClub,
}) {}

export class FootbalistoRankingEntry extends S.Class<FootbalistoRankingEntry>(
  "FootbalistoRankingEntry",
)({
  id: S.Number,
  rank: S.Number,
  matchesPlayed: S.Number,
  wins: S.Number,
  draws: S.Number,
  losses: S.Number,
  goalsScored: S.Number,
  goalsConceded: S.Number,
  points: S.Number,
  team: FootbalistoRankingTeam,
}) {}

export class FootbalistoRankingCompetition extends S.Class<FootbalistoRankingCompetition>(
  "FootbalistoRankingCompetition",
)({
  name: S.String,
  type: S.String,
  teams: S.Array(FootbalistoRankingEntry),
}) {}

export const FootbalistoRankingArray = S.Array(FootbalistoRankingCompetition);

export class FootbalistoEventAction extends S.Class<FootbalistoEventAction>(
  "FootbalistoEventAction",
)({
  type: S.String,
  subtype: S.optional(S.NullOr(S.String)),
  sortOrder: S.optional(S.Number),
  icon: S.optional(S.NullOr(S.String)),
  id: S.optional(S.Number),
}) {}

export class FootbalistoMatchEvent extends S.Class<FootbalistoMatchEvent>(
  "FootbalistoMatchEvent",
)({
  action: FootbalistoEventAction,
  minute: S.optional(S.NullOr(S.Number)),
  playerId: S.optional(S.NullOr(S.Number)),
  playerName: S.optional(S.NullOr(S.String)),
  clubId: S.optional(S.NullOr(S.Number)),
  goalsHome: S.optional(S.NullOr(S.Number)),
  goalsAway: S.optional(S.NullOr(S.Number)),
}) {}

export class FootbalistoLineupPlayer extends S.Class<FootbalistoLineupPlayer>(
  "FootbalistoLineupPlayer",
)({
  number: S.optional(S.NullOr(S.Number)),
  playerName: S.String,
  minutesPlayed: S.optional(S.NullOr(S.Number)),
  captain: S.optional(S.Boolean),
  playerId: S.optional(S.NullOr(S.Number)),
  status: S.optional(S.String),
  changed: S.optional(S.Boolean),
}) {}

export class FootbalistoLineup extends S.Class<FootbalistoLineup>(
  "FootbalistoLineup",
)({
  home: S.Array(FootbalistoLineupPlayer),
  away: S.Array(FootbalistoLineupPlayer),
}) {}

export class PsdCompetitionType extends S.Class<PsdCompetitionType>(
  "PsdCompetitionType",
)({
  id: S.Number,
  name: S.optional(S.NullOr(S.String)),
  type: S.String, // "LEAGUE", "CUP", "FRIENDLY", etc.
}) {}

export class FootbalistoMatchDetailGeneral extends S.Class<FootbalistoMatchDetailGeneral>(
  "FootbalistoMatchDetailGeneral",
)({
  id: S.Number,
  date: S.String,
  time: S.optional(S.String),
  homeClub: FootbalistoClub,
  awayClub: FootbalistoClub,
  goalsHomeTeam: S.NullOr(S.Number),
  goalsAwayTeam: S.NullOr(S.Number),
  homeTeamId: S.optional(S.NullOr(S.Number)),
  awayTeamId: S.optional(S.NullOr(S.Number)),
  competitionType: S.optional(S.NullOr(PsdCompetitionType)),
  viewGameReport: S.Boolean,
  status: S.Number,
  cancelled: S.optional(S.NullOr(S.Boolean)),
}) {}

export class FootbalistoMatchDetailResponse extends S.Class<FootbalistoMatchDetailResponse>(
  "FootbalistoMatchDetailResponse",
)({
  general: FootbalistoMatchDetailGeneral,
  lineup: S.optional(FootbalistoLineup),
  substitutes: S.optional(FootbalistoLineup),
  events: S.optional(S.Array(FootbalistoMatchEvent)),
}) {}

export class PsdSeason extends S.Class<PsdSeason>("PsdSeason")({
  id: S.Number,
  name: S.String,
  start: S.String, // ISO date string
  end: S.String, // ISO date string
}) {}

export const PsdSeasonsSchema = S.Array(PsdSeason);

// ─── Shared game fields ─────────────────────────────────────────────────────
// Field names differ from the old Footbalisto API:
//  - competitionType is an object (not a string)
//  - homeTeam/awayTeam are string team codes ("1", "A") — not used for IDs, use homeClub/awayClub
//  - time is a separate field ("HH:MM"); date has "00:00" as its time component
//  - no timestamp, no viewGameReport (use reportGeneral)

const PsdGameBaseFields = {
  id: S.Number,
  status: S.Number,
  date: S.String, // "YYYY-MM-DD 00:00"
  time: S.optional(S.NullOr(S.String)), // "HH:MM" actual kickoff time
  goalsHomeTeam: S.NullOr(S.Number),
  goalsAwayTeam: S.NullOr(S.Number),
  competitionType: S.optional(S.NullOr(PsdCompetitionType)),
  reportGeneral: S.optional(S.NullOr(S.Boolean)),
  teamId: S.optional(S.NullOr(S.Number)),
  // Separate boolean — a game can be cancelled with goals already set (e.g. 0-0)
  cancelled: S.optional(S.NullOr(S.Boolean)),
  // PSD team IDs for home/away — distinct from club IDs (homeClub.id / awayClub.id)
  homeTeamId: S.optional(S.NullOr(S.Number)),
  awayTeamId: S.optional(S.NullOr(S.Number)),
};

/**
 * Raw game from PSD — external contract.
 * Clubs are nullable because PSD returns null for "ghost" matches
 * (opponent forfeited/removed from league).
 */
export class PsdRawGame extends S.Class<PsdRawGame>("PsdRawGame")({
  ...PsdGameBaseFields,
  homeClub: S.NullOr(FootbalistoClub),
  awayClub: S.NullOr(FootbalistoClub),
}) {}

/**
 * Validated game — internal contract.
 * Both clubs guaranteed non-null; safe to use in transforms.
 */
export class PsdGame extends S.Class<PsdGame>("PsdGame")({
  ...PsdGameBaseFields,
  homeClub: FootbalistoClub,
  awayClub: FootbalistoClub,
}) {}

export const PsdMatchListSchema = S.Struct({
  content: S.Array(S.Unknown),
});
