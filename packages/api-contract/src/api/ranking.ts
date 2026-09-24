import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { RankingTableArray } from "../schemas/ranking";
import {
  HttpServiceUnavailable,
  HttpBadGateway,
  HttpNotFound,
} from "../schemas/http-errors";

export class RankingApi extends HttpApiGroup.make("ranking")
  .add(
    HttpApiEndpoint.get("getRanking", "/ranking/:teamId")
      .setPath(S.Struct({ teamId: S.NumberFromString.pipe(S.int()) }))
      .addSuccess(RankingTableArray)
      .addError(HttpServiceUnavailable)
      .addError(HttpBadGateway)
      .addError(HttpNotFound),
  ) {}
