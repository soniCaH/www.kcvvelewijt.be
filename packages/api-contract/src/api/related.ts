import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { RelatedItem } from "../schemas/related";
import { HttpServiceUnavailable } from "../schemas/http-errors";

export class RelatedApi extends HttpApiGroup.make("related").add(
  HttpApiEndpoint.get("getRelated", "/related")
    .setUrlParams(
      S.Struct({
        // A Sanity document id. Anything else is a 400 before any
        // Vectorize or KV work (#3468).
        id: S.String.pipe(S.pattern(/^[A-Za-z0-9._-]{1,128}$/)),
        limit: S.optional(S.NumberFromString.pipe(S.int(), S.between(1, 5))),
      }),
    )
    .addSuccess(S.Array(RelatedItem))
    .addError(HttpServiceUnavailable),
) {}
