import { Schema as S } from "effect";
import { HttpApiSchema } from "@effect/platform";

export class HttpServiceUnavailable extends S.TaggedError<HttpServiceUnavailable>()(
  "HttpServiceUnavailable",
  { error: S.String },
  HttpApiSchema.annotations({ status: 503 }),
) {}

export class HttpBadGateway extends S.TaggedError<HttpBadGateway>()(
  "HttpBadGateway",
  { error: S.String },
  HttpApiSchema.annotations({ status: 502 }),
) {}

export class HttpNotFound extends S.TaggedError<HttpNotFound>()(
  "HttpNotFound",
  { error: S.String },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class HttpBadRequest extends S.TaggedError<HttpBadRequest>()(
  "HttpBadRequest",
  {
    error: S.String,
    /** Optional per-field validation messages, keyed by field name. */
    fields: S.optional(S.Record({ key: S.String, value: S.String })),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}
