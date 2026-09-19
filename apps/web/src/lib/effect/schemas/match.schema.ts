// Re-export normalized types from api-contract for backward compatibility.
// `MatchesArray`, `MatchesResponse`, `MatchLineup` and `MatchTeam` are NOT
// re-exported here: nothing in apps/web imports them through this compat
// path (they have real consumers, just from apps/api and
// packages/api-contract directly, importing `@kcvv/api-contract` itself).
export {
  CardType,
  Match,
  MatchDetail,
  MatchLineupPlayer,
  MatchStatus,
} from "@kcvv/api-contract";
