import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { TeamStats } from "../schemas/stats";
import {
  HttpServiceUnavailable,
  HttpBadGateway,
  HttpNotFound,
} from "../schemas/http-errors";

export class StatsApi extends HttpApiGroup.make("stats")
  .add(
    HttpApiEndpoint.get("getTeamStats", "/stats/team/:teamId")
      .setPath(S.Struct({ teamId: S.NumberFromString }))
      .addSuccess(TeamStats)
      .addError(HttpServiceUnavailable)
      .addError(HttpBadGateway)
      .addError(HttpNotFound),
  ) {}
