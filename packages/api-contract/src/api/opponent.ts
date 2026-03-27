import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { OpponentHistory } from "../schemas/opponent";
import {
  HttpServiceUnavailable,
  HttpBadGateway,
  HttpNotFound,
} from "../schemas/http-errors";

export class OpponentApi extends HttpApiGroup.make("opponent").add(
  HttpApiEndpoint.get(
    "getOpponentHistory",
    "/matches/opponent/:teamId/:clubId",
  )
    .setPath(
      S.Struct({
        teamId: S.NumberFromString,
        clubId: S.NumberFromString,
      }),
    )
    .addSuccess(OpponentHistory)
    .addError(HttpServiceUnavailable)
    .addError(HttpBadGateway)
    .addError(HttpNotFound),
) {}
