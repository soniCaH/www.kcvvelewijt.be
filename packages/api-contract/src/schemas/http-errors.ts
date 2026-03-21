import { Schema as S } from "effect";

export class HttpServiceUnavailable extends S.TaggedError<HttpServiceUnavailable>()(
  "HttpServiceUnavailable",
  { error: S.String },
  { status: 503 },
) {}

export class HttpBadGateway extends S.TaggedError<HttpBadGateway>()(
  "HttpBadGateway",
  { error: S.String },
  { status: 502 },
) {}

export class HttpNotFound extends S.TaggedError<HttpNotFound>()(
  "HttpNotFound",
  { error: S.String },
  { status: 404 },
) {}
