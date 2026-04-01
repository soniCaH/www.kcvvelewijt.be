import { Schema as S } from "effect";

export class PlayerTeamStats extends S.Class<PlayerTeamStats>(
  "PlayerTeamStats",
)({
  team: S.String,
  gamesPlayed: S.Number,
  gamesWon: S.Number,
  gamesEqual: S.Number,
  gamesLost: S.Number,
  goals: S.Number,
  assists: S.Number,
  yellowCards: S.Number,
  redCards: S.Number,
  minutes: S.Number,
}) {}

export class PlayerSeasonStats extends S.Class<PlayerSeasonStats>(
  "PlayerSeasonStats",
)({
  memberId: S.Number,
  teams: S.Array(PlayerTeamStats),
}) {}
