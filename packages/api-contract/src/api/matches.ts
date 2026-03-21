import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { Match, MatchDetail, MatchesArray } from "../schemas/match";
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
  ) {}
