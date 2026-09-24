import { Schema as S } from "effect";

export class PlayerTeamStats extends S.Class<PlayerTeamStats>(
  "PlayerTeamStats",
)({
  team: S.String,
  gamesPlayed: S.Finite,
  gamesWon: S.Finite,
  gamesEqual: S.Finite,
  gamesLost: S.Finite,
  goals: S.Finite,
  assists: S.Finite,
  yellowCards: S.Finite,
  redCards: S.Finite,
  minutes: S.Finite,
}) {}

export class PlayerSeasonStats extends S.Class<PlayerSeasonStats>(
  "PlayerSeasonStats",
)({
  memberId: S.Finite,
  teams: S.Array(PlayerTeamStats),
}) {}
