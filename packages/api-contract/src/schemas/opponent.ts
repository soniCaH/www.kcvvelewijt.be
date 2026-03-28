import { Schema as S } from "effect";
import { Match } from "./match";

/** Summary of all historical matches against a specific opponent */
export class OpponentSummary extends S.Class<OpponentSummary>(
  "OpponentSummary",
)({
  wins: S.Number,
  draws: S.Number,
  losses: S.Number,
  goalsFor: S.Number,
  goalsAgainst: S.Number,
}) {}

/** Opponent club info */
export class OpponentInfo extends S.Class<OpponentInfo>("OpponentInfo")({
  id: S.Number,
  name: S.String,
  logo: S.optional(S.String),
}) {}

/** Full opponent history response */
export class OpponentHistory extends S.Class<OpponentHistory>(
  "OpponentHistory",
)({
  opponent: OpponentInfo,
  summary: OpponentSummary,
  matches: S.Array(Match),
}) {}
