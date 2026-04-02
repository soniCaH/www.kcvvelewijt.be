/**
 * Shared search types used by both API and UI
 */

export type SearchResultType = "article" | "player" | "staff" | "team";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  tags?: string[];
  date?: string;
}

export interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}
