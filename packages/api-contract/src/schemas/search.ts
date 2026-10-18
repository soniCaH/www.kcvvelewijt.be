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

/** A youth team's U-code as the club names it: `U9`, `U17`. */
const TeamAge = S.String.pipe(S.pattern(/^U\d{1,2}$/));

/**
 * The AI fallback of the `/hulp` team card (#3559): the query the rules found
 * no team for, and the U-codes the club fields — the only answers allowed.
 */
export class TeamGuessRequest extends S.Class<TeamGuessRequest>(
  "TeamGuessRequest",
)({
  query: S.Trim.pipe(S.minLength(1), S.maxLength(1024)),
  ages: S.Array(TeamAge).pipe(S.minItems(1), S.maxItems(30)),
}) {}

/** One of the request's `ages`, or `null` — the AI found none, or was not asked. */
export class TeamGuessResponse extends S.Class<TeamGuessResponse>(
  "TeamGuessResponse",
)({
  age: S.NullOr(TeamAge),
}) {}
