import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { RelatedItem } from "../schemas/related";
import { HttpServiceUnavailable } from "../schemas/http-errors";

export class RelatedApi extends HttpApiGroup.make("related").add(
  HttpApiEndpoint.get("getRelated", "/related")
    .setUrlParams(
      S.Struct({
        id: S.String.pipe(S.minLength(1)),
        limit: S.optional(S.NumberFromString.pipe(S.int(), S.between(1, 5))),
      }),
    )
    .addSuccess(S.Array(RelatedItem))
    .addError(HttpServiceUnavailable),
) {}
