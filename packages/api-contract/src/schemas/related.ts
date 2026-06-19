import { Schema as S } from "effect";

export class RelatedItem extends S.Class<RelatedItem>("RelatedItem")({
  /** Sanity document _id */
  id: S.String,
  /** URL-friendly slug */
  slug: S.String,
  /** Content type */
  type: S.Literal("article", "page"),
  /** Cosine similarity score (0–1) */
  score: S.Number,
  /** Display title */
  title: S.String,
  /** Short excerpt for display */
  excerpt: S.String,
  /** Cover image URL — null for pages and articles without a cover image */
  imageUrl: S.optionalWith(S.NullOr(S.String), { default: () => null }),
}) {}
