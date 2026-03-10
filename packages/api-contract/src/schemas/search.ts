import { Schema as S } from "effect";

export const SearchContentType = S.Literal(
  "responsibility",
  "article",
  "general",
);

export class SearchRequest extends S.Class<SearchRequest>("SearchRequest")({
  query: S.String.pipe(S.minLength(1)),
  type: S.optional(SearchContentType),
  limit: S.optional(S.Int.pipe(S.between(1, 10))).pipe(
    S.withDefaults({ constructor: () => 5, decoding: () => 5 }),
  ),
}) {}

export class SearchResult extends S.Class<SearchResult>("SearchResult")({
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

export class SearchResponse extends S.Class<SearchResponse>("SearchResponse")({
  results: S.Array(SearchResult),
}) {}
