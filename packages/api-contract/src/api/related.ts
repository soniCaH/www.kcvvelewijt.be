import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { RelatedItem } from "../schemas/related";
import { HttpServiceUnavailable } from "../schemas/http-errors";

export class RelatedApi extends HttpApiGroup.make("related").add(
  HttpApiEndpoint.get("getRelated", "/related")
    .setUrlParams(
      S.Struct({
        id: S.String,
        limit: S.optional(S.NumberFromString),
      }),
    )
    .addSuccess(S.Array(RelatedItem))
    .addError(HttpServiceUnavailable),
) {}
