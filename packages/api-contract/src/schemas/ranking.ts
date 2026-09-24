import { Schema as S } from "effect";

/** Normalized ranking entry for UI consumption */
export class RankingEntry extends S.Class<RankingEntry>("RankingEntry")({
  position: S.Finite,
  team_id: S.Finite,
  /** PSD club id (e.g. 1235 for KCVV). Lets consumers match a ranking row to a
   * match side, whose home/away ids are club ids — not PSD team ids. */
  club_id: S.optional(S.Finite),
  team_name: S.String,
  team_logo: S.optional(S.String),
  played: S.Finite,
  won: S.Finite,
  drawn: S.Finite,
  lost: S.Finite,
  goals_for: S.Finite,
  goals_against: S.Finite,
  goal_difference: S.Finite,
  points: S.Finite,
  form: S.optional(S.String),
}) {}

export const RankingArray = S.Array(RankingEntry);

/**
 * One published league table. A team can play more than one official
 * competition in a season — every youth side gets a fresh poule at the winter
 * break — so `#klassement` renders every table the association publishes
 * rather than picking one (#2589).
 *
 * December adds an optional `period` and an `is_current` flag; both are
 * additive under Effect Schema.
 */
export class RankingTable extends S.Class<RankingTable>("RankingTable")({
  /** Provider competition id — the only stable key for a phase. Two same-named
   * youth tables have no identity without it. */
  competition_id: S.Finite,
  /** Provider name, prefix/suffix stripped. Consumers prefer the editorial
   * `divisionFull` when Sanity carries one — the federation's name for a reeks
   * is not the club's. */
  competition_name: S.String,
  entries: RankingArray,
}) {}

export const RankingTableArray = S.Array(RankingTable);
