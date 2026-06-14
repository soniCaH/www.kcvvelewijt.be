"use client";

/**
 * SearchResults Component
 * Display list of search results
 */

import type {
  SearchResult as SearchResultItem,
  SearchResultType,
} from "./SearchInterface";
import { SearchResult } from "./SearchResult";
import { SearchNoResultsCard } from "./SearchNoResultsCard";
import { filterByActiveType } from "./search-filter-utils";

export interface SearchResultsProps {
  /**
   * Search results to display
   */
  results: SearchResultItem[];
  /**
   * Search query for highlighting
   */
  query: string;
  /**
   * Active content type filter
   */
  activeType: SearchResultType | "all";
  /**
   * Callback when a result is clicked (resultType, resultTitle, 0-indexed position)
   */
  onResultClick?: (
    resultType: string,
    resultTitle: string,
    index: number,
  ) => void;
}

/**
 * Search results list
 * Note: Results are always unfiltered from API.
 * Client-side filtering is applied here based on activeType.
 */
export const SearchResults = ({
  results,
  query,
  activeType,
  onResultClick,
}: SearchResultsProps) => {
  // Filter results by active type (client-side)
  const filteredResults = filterByActiveType(results, activeType);

  if (filteredResults.length === 0) {
    return <SearchNoResultsCard query={query} />;
  }

  return (
    <div className="space-y-6">
      {/* Results count — mono meta line (8s2). */}
      <p className="text-ink-muted font-mono text-xs tracking-[0.04em]">
        <span className="text-ink font-semibold">{filteredResults.length}</span>{" "}
        {filteredResults.length === 1 ? "resultaat" : "resultaten"} voor &ldquo;
        <span className="text-ink font-semibold">{query}</span>&rdquo;
      </p>

      {/* Results list — generous gap so the corner stamps don't crowd the row
          above (postmark stamps overhang the top edge). */}
      <div className="space-y-6">
        {filteredResults.map((result, index) => (
          <SearchResult
            key={`${result.type}:${result.id}`}
            result={result}
            onClick={() => onResultClick?.(result.type, result.title, index)}
          />
        ))}
      </div>
    </div>
  );
};
