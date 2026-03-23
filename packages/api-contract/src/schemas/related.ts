import { Schema as S } from "effect";

export class RelatedRequest extends S.Class<RelatedRequest>("RelatedRequest")({
  id: S.String.pipe(S.minLength(1)),
  limit: S.optional(S.Int.pipe(S.between(1, 5))).pipe(
    S.withDefaults({ constructor: () => 3, decoding: () => 3 }),
  ),
}) {}

export class RelatedItem extends S.Class<RelatedItem>("RelatedItem")({
  /** Sanity document _id */
  id: S.String,
  /** URL-friendly slug */
  slug: S.String,
  /** Content type */
  type: S.Literal("responsibilityPath", "article", "page"),
  /** Cosine similarity score (0–1) */
  score: S.Number,
  /** Display title */
  title: S.String,
  /** Short excerpt for display */
  excerpt: S.String,
}) {}
