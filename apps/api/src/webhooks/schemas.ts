import { Schema as S } from "effect";

export class WebhookPayload extends S.Class<WebhookPayload>("WebhookPayload")({
  _id: S.String,
  _type: S.String,
  _rev: S.optional(S.String),
}) {}
