import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import {
  DartsSignupRequest,
  DartsSignupResponse,
  DartsSpotsResponse,
} from "../schemas/darts";
import { MembershipRequest, MembershipResponse } from "../schemas/forms";
import { HttpBadRequest, HttpServiceUnavailable } from "../schemas/http-errors";

export class FormsApi extends HttpApiGroup.make("forms")
  .add(
    HttpApiEndpoint.post("membershipForm", "/forms/membership")
      .setPayload(MembershipRequest)
      .addSuccess(MembershipResponse)
      .addError(HttpBadRequest)
      .addError(HttpServiceUnavailable),
  )
  .add(
    HttpApiEndpoint.post("dartsSignup", "/forms/darts")
      .setPayload(DartsSignupRequest)
      .addSuccess(DartsSignupResponse)
      .addError(HttpBadRequest)
      .addError(HttpServiceUnavailable),
  )
  .add(
    HttpApiEndpoint.get("dartsSpots", "/forms/darts/spots")
      .addSuccess(DartsSpotsResponse)
      .addError(HttpServiceUnavailable),
  ) {}
