import { Schema as S } from "effect";

export class WebhookPayload extends S.Class<WebhookPayload>("WebhookPayload")({
  _id: S.NonEmptyString,
  _type: S.NonEmptyString,
  _rev: S.optional(S.String),
}) {}
