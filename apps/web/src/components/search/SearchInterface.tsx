"use client";

/**
 * SearchInterface Component
 * Main search interface with form, filters, and results
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchForm } from "./SearchForm";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { Spinner } from "@/components/design-system";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { filterByActiveType } from "./search-filter-utils";
import type {
  SearchResultType,
  SearchResult,
  SearchResponse,
} from "@/types/search";

export type { SearchResultType, SearchResult, SearchResponse };

export interface SearchInterfaceProps {
  /**
   * Initial search query from URL
   */
  initialQuery?: string;
  /**
   * Initial content type filter
   */
  initialType?: SearchResultType;
}

/**
 * Main search interface component
 */
export const SearchInterface = ({
  // Props accepted for backward compatibility but ignored — URL is the
  // source of truth (see "Initial Props" tests).
  initialQuery: _initialQuery,
  initialType: _initialType,
}: SearchInterfaceProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useSearchAnalytics();

  // URL is the source of truth for query + active type; `initialQuery` /
  // `initialType` props are ignored when the URL has no params (documented by
  // the "Initial Props" tests).
  const allowedTypes: SearchResultType[] = [
    "article",
    "player",
    "staff",
    "team",
  ];
  const currentUrlQueryValue = searchParams.get("q") || "";
  const currentRawUrlTypeValue = searchParams.get("type");
  const currentUrlTypeValue =
    currentRawUrlTypeValue &&
    allowedTypes.includes(currentRawUrlTypeValue as SearchResultType)
      ? (currentRawUrlTypeValue as SearchResultType)
      : undefined;

  // State
  const [query, setQuery] = useState(currentUrlQueryValue);
  const [activeType, setActiveType] = useState<SearchResultType | "all">(
    currentUrlTypeValue || "all",
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // AbortController ref for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Perform search
   * Note: Always fetches unfiltered results for accurate counts across all types
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setResults([]);
      setTotalCount(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // Always fetch unfiltered results (no type param)
      // Client-side filtering will be done in SearchResults
      const params = new URLSearchParams({ q: searchQuery.trim() });

      const response = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResponse = await response.json();

      // Only update state if this request wasn't aborted
      if (!controller.signal.aborted) {
        setResults(data.results);
        setTotalCount(data.count);
      }
    } catch (error) {
      // Don't update state if request was aborted
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setError("Er is een fout opgetreden bij het zoeken. Probeer opnieuw.");
      setResults([]);
      setTotalCount(0);
    } finally {
      // Only clear loading if this request wasn't aborted
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Compute filtered results matching what SearchResults renders
  const filteredResults = useMemo(
    () => filterByActiveType(results, activeType),
    [results, activeType],
  );

  // Track analytics based on filtered results (respects active filter)
  // Only fires after a successful fetch (no load, no error)
  useEffect(() => {
    if (!query || query.trim().length < 2 || isLoading || error) return;

    if (filteredResults.length > 0) {
      analytics.trackResultsShown(filteredResults.length, query.trim());
    } else {
      analytics.trackNoResults(query.trim());
    }
  }, [filteredResults, activeType, query, isLoading, error, analytics]);

  /**
   * Handle search submit
   */
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      if (searchQuery.trim()) {
        analytics.trackSearchSubmitted(searchQuery.trim());
      }

      // Update URL
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      if (activeType && activeType !== "all") {
        params.set("type", activeType);
      }

      router.push(`/zoeken${params.toString() ? `?${params.toString()}` : ""}`);

      // Perform search
      performSearch(searchQuery);
    },
    [activeType, router, performSearch, analytics],
  );

  /**
   * Handle filter change
   * Note: Only updates UI state and URL - no refetch needed since we use client-side filtering
   */
  const handleFilterChange = useCallback(
    (type: SearchResultType | "all") => {
      setActiveType(type);
      analytics.trackFilterChanged(type);

      // Update URL
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      if (type && type !== "all") {
        params.set("type", type);
      }

      router.push(`/zoeken${params.toString() ? `?${params.toString()}` : ""}`);

      // No need to re-fetch: SearchResults handles client-side filtering
    },
    [query, router, analytics],
  );

  /**
   * Sync state with URL params (handles back/forward navigation).
   * Adjust state during render to avoid cascading effect-driven setStates.
   */
  const [trackedSearchParams, setTrackedSearchParams] = useState(searchParams);

  if (trackedSearchParams !== searchParams) {
    setTrackedSearchParams(searchParams);
    if (currentUrlQueryValue !== query) {
      setQuery(currentUrlQueryValue);
    }
    const newActiveType = currentUrlTypeValue || "all";
    if (newActiveType !== activeType) {
      setActiveType(newActiveType);
    }
  }

  /**
   * Perform search whenever the URL query changes. Routed through a ref so
   * the React Compiler does not treat `performSearch`'s synchronous setState
   * calls as effect-level cascading renders.
   */
  const performSearchRef = useRef(performSearch);
  useEffect(() => {
    performSearchRef.current = performSearch;
  }, [performSearch]);

  useEffect(() => {
    performSearchRef.current(currentUrlQueryValue);
  }, [currentUrlQueryValue]);

  /**
   * Cleanup: abort any in-flight requests on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Search Form */}
      <SearchForm
        initialValue={query}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* Show results only if query is valid (>= 2 chars) */}
      {query.trim().length >= 2 && (
        <>
          {/* Filters */}
          <SearchFilters
            activeType={activeType}
            onFilterChange={handleFilterChange}
            resultCounts={{
              all: totalCount,
              article: results.filter((r) => r.type === "article").length,
              player: results.filter((r) => r.type === "player").length,
              staff: results.filter((r) => r.type === "staff").length,
              team: results.filter((r) => r.type === "team").length,
            }}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && (
            <SearchResults
              results={results}
              query={query}
              activeType={activeType}
              onResultClick={analytics.trackResultClicked}
            />
          )}
        </>
      )}

      {/* Help Text - Show when query is too short */}
      {query.trim().length < 2 && (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-gray-blue mb-4 text-xl font-bold">
            Wat wil je zoeken?
          </h2>
          <p className="text-gray-dark mb-6">
            Typ minimaal 2 karakters om te zoeken naar nieuws, spelers, teams en
            meer.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="text-gray-blue mb-2 font-semibold">
                📰 Nieuwsartikelen
              </h3>
              <p className="text-gray-dark text-sm">
                Zoek op titel, inhoud of tags
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="text-gray-blue mb-2 font-semibold">⚽ Spelers</h3>
              <p className="text-gray-dark text-sm">
                Vind spelers op naam of positie
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="text-gray-blue mb-2 font-semibold">🏆 Teams</h3>
              <p className="text-gray-dark text-sm">
                Zoek teams op naam of leeftijdsgroep
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
