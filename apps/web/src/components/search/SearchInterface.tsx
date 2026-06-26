"use client";

/**
 * SearchInterface Component
 * Main search interface with form, filters, and results
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchForm } from "./SearchForm";
import { SearchMasthead } from "./SearchMasthead";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { SearchPreSearchCard } from "./SearchPreSearchCard";
import { SearchAnswerCard } from "./SearchAnswerCard";
import { SearchRelated } from "./SearchRelated";
import { useSemanticAugment } from "./useSemanticAugment";
import { Alert, PageContainer, Spinner } from "@/components/design-system";
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

      setError("Er ging iets mis bij het zoeken — probeer opnieuw.");
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

  // Semantic augment lane (8s5 / ZOEK-3) — one fetch resolved into the card
  // (above results) or the "Gerelateerd" links (below results). De-dupe against
  // the lexical result URLs so the same article never shows twice.
  const lexicalUrls = useMemo(
    () => new Set(results.map((result) => result.url)),
    [results],
  );
  const augment = useSemanticAugment(query, lexicalUrls);

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
    <>
      {/* Dark search masthead — the field is the hero (8s1). */}
      <SearchMasthead>
        <SearchForm
          initialValue={query}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </SearchMasthead>

      {/* Results region on cream, below the band. */}
      <PageContainer width="index" className="space-y-8 py-12">
        {/* Show results only if query is valid (>= 2 chars) */}
        {query.trim().length >= 2 && (
          <>
            {/* High-confidence semantic answer (8s5 / ZOEK-3) — the "Slim
                antwoord" card sits ABOVE the lexical results. */}
            {augment.kind === "answer" && (
              <SearchAnswerCard
                answer={augment.answer}
                sources={augment.sources}
              />
            )}

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

            {/* Error State — paper ticket-stub Alert (8s4). */}
            {error && !isLoading && (
              <Alert variant="error" title="Zoeken mislukt">
                {error}
              </Alert>
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

            {/* Low-confidence semantic fallback (8s5 / ZOEK-3) — "Gerelateerd"
                links sit BELOW the lexical results; supplementary, not a
                headline. Renders nothing when there's a high-confidence answer
                (mutually exclusive) or on low scores / endpoint failure. */}
            {augment.kind === "related" && (
              <SearchRelated items={augment.items} />
            )}
          </>
        )}

        {/* Pre-search state — football-voice paper card (8s4). Centred in the
            available space (ZOEK-1) so the empty state doesn't strand a gap
            between the masthead and the footer. */}
        {query.trim().length < 2 ? (
          <div className="flex min-h-[45vh] items-center justify-center">
            <SearchPreSearchCard />
          </div>
        ) : null}
      </PageContainer>
    </>
  );
};
