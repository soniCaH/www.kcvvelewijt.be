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
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="text-gray-blue mb-2 text-xl font-bold">
          Geen resultaten gevonden
        </h3>
        <p className="text-gray-dark">
          Probeer een andere zoekopdracht of pas de filters aan
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Count */}
      <div className="text-gray-dark">
        <span className="text-gray-blue font-semibold">
          {filteredResults.length}
        </span>{" "}
        {filteredResults.length === 1 ? "resultaat" : "resultaten"} voor &quot;
        <span className="text-gray-blue font-semibold">{query}</span>&quot;
      </div>

      {/* Results List */}
      <div className="space-y-4">
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
