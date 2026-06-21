import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { MembershipRequest, MembershipResponse } from "../schemas/forms";
import { HttpBadRequest, HttpServiceUnavailable } from "../schemas/http-errors";

export class FormsApi extends HttpApiGroup.make("forms").add(
  HttpApiEndpoint.post("membershipForm", "/forms/membership")
    .setPayload(MembershipRequest)
    .addSuccess(MembershipResponse)
    .addError(HttpBadRequest)
    .addError(HttpServiceUnavailable),
) {}
