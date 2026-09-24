import { Schema as S } from "effect";

export const SearchContentType = S.Literal(
  "responsibility",
  "article",
  "general",
);

export class SearchRequest extends S.Class<SearchRequest>("SearchRequest")({
  query: S.Trim.pipe(S.minLength(1), S.maxLength(1024)),
  type: S.optional(SearchContentType),
  limit: S.optional(S.Int.pipe(S.between(1, 10))).pipe(
    S.withDefaults({ constructor: () => 5, decoding: () => 5 }),
  ),
}) {}

/**
 * The content types a search result can carry. Named so the worker can filter
 * the index against it: Vectorize holds vectors of types the API has since
 * retired, and an unexpected one fails the whole SearchResponse rather than
 * its own row.
 */
export const SearchResultType = S.Literal("responsibility", "article", "page");

export class SearchResult extends S.Class<SearchResult>("SearchResult")({
  /** Sanity document _id */
  id: S.String,
  /** URL-friendly slug */
  slug: S.String,
  /** Content type */
  type: SearchResultType,
  /** Cosine similarity score (0–1) */
  score: S.Finite,
  /** Display title */
  title: S.String,
  /** Short excerpt for display */
  excerpt: S.String,
}) {}

export class SearchResponse extends S.Class<SearchResponse>("SearchResponse")({
  results: S.Array(SearchResult),
  answer: S.optional(S.String.pipe(S.pattern(/\S/))),
}) {}

export class FeedbackRequest extends S.Class<FeedbackRequest>(
  "FeedbackRequest",
)({
  pathSlug: S.String.pipe(S.minLength(1)),
  pathTitle: S.String,
  vote: S.Literal("up", "down"),
}) {}

export class FeedbackResponse extends S.Class<FeedbackResponse>(
  "FeedbackResponse",
)({
  ok: S.Boolean,
}) {}
