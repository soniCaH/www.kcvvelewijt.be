import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { Match, MatchDetail, MatchesArray } from "../schemas/match";
import { PlayerSeasonStats } from "../schemas/player-stats";
import {
  HttpServiceUnavailable,
  HttpBadGateway,
  HttpNotFound,
} from "../schemas/http-errors";

export class MatchesApi extends HttpApiGroup.make("matches")
  .add(
    HttpApiEndpoint.get("getMatchesByTeam", "/matches/:teamId")
      .setPath(S.Struct({ teamId: S.NumberFromString }))
      .addSuccess(MatchesArray)
      .addError(HttpServiceUnavailable)
      .addError(HttpBadGateway)
      .addError(HttpNotFound),
  )
  .add(
    HttpApiEndpoint.get("getNextMatches", "/matches/next")
      .addSuccess(MatchesArray)
      .addError(HttpServiceUnavailable)
      .addError(HttpBadGateway)
      .addError(HttpNotFound),
  )
  .add(
    // Matches with kickoff in a window around now ([start of today, now + 7d],
    // Brussels) — includes already-started/finished matches, unlike
    // getNextMatches. Powers the matchday-aware /share autocomplete.
    HttpApiEndpoint.get("getMatchesWindow", "/matches/window")
      .addSuccess(MatchesArray)
      .addError(HttpServiceUnavailable)
      .addError(HttpBadGateway)
      .addError(HttpNotFound),
  )
  .add(
    HttpApiEndpoint.get("getMatchById", "/match/:matchId")
      .setPath(S.Struct({ matchId: S.NumberFromString }))
      .addSuccess(Match)
      .addError(HttpServiceUnavailable)
      .addError(HttpBadGateway)
      .addError(HttpNotFound),
  )
  .add(
    HttpApiEndpoint.get("getMatchDetail", "/match/:matchId/detail")
      .setPath(S.Struct({ matchId: S.NumberFromString }))
      .addSuccess(MatchDetail)
      .addError(HttpServiceUnavailable)
      .addError(HttpBadGateway)
      .addError(HttpNotFound),
  )
  .add(
    HttpApiEndpoint.get("getPlayerStats", "/statistics/player/:memberId")
      .setPath(S.Struct({ memberId: S.NumberFromString }))
      .addSuccess(PlayerSeasonStats)
      .addError(HttpServiceUnavailable)
      .addError(HttpBadGateway)
      .addError(HttpNotFound),
  ) {}
