/**
 * Shared search types used by both API and UI.
 *
 * Schemas, not interfaces: `GET /api/search` encodes its answer with
 * `LexicalSearchResponse` and `SearchInterface` decodes it with the same one,
 * so the two cannot drift apart (#3878). The semantic lane's `SearchResponse`
 * is the contract's (`@kcvv/api-contract`); this one is the site's own title
 * search over articles, players, staff and teams.
 */
import { Schema as S } from "effect";

export const SearchResultType = S.Literal("article", "player", "staff", "team");
export type SearchResultType = S.Schema.Type<typeof SearchResultType>;

export const SearchResult = S.Struct({
  id: S.String,
  type: SearchResultType,
  title: S.String,
  description: S.optional(S.String),
  url: S.String,
  imageUrl: S.optional(S.String),
  tags: S.optional(S.mutable(S.Array(S.String))),
  date: S.optional(S.String),
});
export type SearchResult = S.Schema.Type<typeof SearchResult>;

export const LexicalSearchResponse = S.Struct({
  query: S.String,
  count: S.Int,
  results: S.mutable(S.Array(SearchResult)),
});
export type LexicalSearchResponse = S.Schema.Type<typeof LexicalSearchResponse>;
