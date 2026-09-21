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
import { EmptyState, PageContainer, Spinner } from "@/components/design-system";
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
  // `useSearchAnalytics()` returns a bare object literal (the house pattern —
  // all eight `use*Analytics` hooks do this), so `analytics` itself is a new
  // reference on every render even though each tracker inside it is a
  // `useCallback(…, [])`. The results-tracking effect and `handleSearch`
  // below depend on these trackers directly rather than on `analytics`, so a
  // render that changes nothing else doesn't re-run them (#2913).
  const {
    trackResultsShown,
    trackNoResults,
    trackSearchSubmitted,
    trackSearchFailed,
  } = analytics;

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
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // The (trimmed) query a fetch has actually resolved against, or `null` if
  // none has yet. On the very first commit of a URL-preset query — a shared
  // link, a refresh, or a back/forward into `/zoeken?q=...` — `results` is
  // still its initial `[]` and `isLoading`/`error` are still `false`,
  // indistinguishable from a settled empty result set (#2918). Comparing
  // this against the live `query` (not a plain boolean) also covers a query
  // change that arrives via the render-time URL sync below rather than
  // through `handleSearch`: `results` would otherwise still hold the
  // PREVIOUS query's answer for one commit.
  const [lastSettledQuery, setLastSettledQuery] = useState<string | null>(null);

  // AbortController ref for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // The query `performSearch` is currently in flight for, or last resolved
  // as the current result set — whichever happened most recently. Read by
  // the URL-watching effect below to skip a redundant fetch for a query it
  // already has covered (#2784). A ref, not state: it must not itself cause
  // a render.
  const lastRequestedQueryRef = useRef<string | null>(null);

  // Guards the `search_failed` fire-once behaviour (#2824): reset at the
  // start of every `performSearch` attempt (alongside `setError(false)`),
  // flipped once the failed-search effect below has reported this attempt.
  // A ref, not state — re-running the effect when `augment` settles later
  // must be able to see this without itself causing a render.
  const failureTrackedRef = useRef(false);

  /**
   * Perform search
   * Note: Always fetches unfiltered results for accurate counts across all types
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    lastRequestedQueryRef.current = searchQuery;

    if (!searchQuery || searchQuery.trim().length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setResults([]);
      setTotalCount(0);
      setError(false);
      setIsLoading(false);
      // A stale `lastSettledQuery` from a previous query would otherwise
      // survive this reset and wrongly match again if the visitor returns
      // to that exact query later (e.g. clear, then browser forward) —
      // #2918 review.
      setLastSettledQuery(null);
      failureTrackedRef.current = false;
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
    setError(false);
    failureTrackedRef.current = false;

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
        setLastSettledQuery(searchQuery.trim());
      }
    } catch (error) {
      // Don't update state if request was aborted
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setError(true);
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

  // The lexical fetch has already failed, but the semantic lane hasn't
  // settled yet — so it's still unknown whether an answer is about to
  // suppress the failure notice (#2824 review, round 2). Derived once and
  // reused by both the results-slot spinner (keep it up, no empty gap
  // while this is true) and the notice gate (stay suppressed while this is
  // true) below, so the two conditions can never disagree about what's on
  // screen. Bounded by the semantic POST proxy's own 15s cap
  // (`AbortSignal.timeout(15_000)`, `app/api/search/route.ts`) — this can't
  // leave the spinner up indefinitely.
  const awaitingSemantic = error && !isLoading && augment.kind === "pending";

  // Track analytics based on filtered results (respects active filter)
  // Only fires after a successful fetch (no load, no error) for the query
  // currently on screen — `lastSettledQuery !== query.trim()` covers the
  // pre-fetch window on mount/URL-sync where `results` is stale or still
  // its initial `[]` (#2918).
  useEffect(() => {
    if (!query || query.trim().length < 2 || isLoading || error) return;
    if (lastSettledQuery !== query.trim()) return;

    if (filteredResults.length > 0) {
      trackResultsShown(filteredResults.length, query.trim());
    } else {
      trackNoResults(query.trim());
    }
  }, [
    filteredResults,
    activeType,
    query,
    isLoading,
    error,
    lastSettledQuery,
    trackResultsShown,
    trackNoResults,
  ]);

  // Count a lexical search failure (#2824) — fires whether or not the
  // failed-search notice below is suppressed by a high-confidence semantic
  // answer, so suppressing the notice costs no visibility. `answer_shown`
  // reads the same `augment.kind === "answer"` expression the notice's own
  // gate uses, so the two can never disagree about what the visitor saw.
  //
  // Waits out `awaitingSemantic` before firing at all — same derived value
  // the results-slot spinner and the notice gate below use, so this effect
  // can never fire while either of those is still showing the wait state.
  // In the real request order the semantic POST debounces 300ms before it
  // even starts, so on a genuine lexical failure `augment` is almost always
  // still "pending" when `error` first goes true — firing off a
  // still-pending augment reported `answer_shown: false` for a search an
  // answer was about to suppress (review finding on the first version of
  // this PR: the two states could disagree in the common case, not just in
  // a rare race). `useSemanticAugment`'s own settlement gate covers both a
  // successful AND a failed semantic fetch (`useSemanticSearch`'s `catch`
  // also updates `executedQuery`), so a fully-down semantic lane still
  // settles to `none` and this effect still fires — AC 3 keeps working. The
  // semantic POST proxy caps that wait at 15s
  // (`AbortSignal.timeout(15_000)`, `app/api/search/route.ts`), so this
  // cannot stall the count indefinitely.
  //
  // Fire-once via `failureTrackedRef` (reset alongside every `setError(false)`
  // in `performSearch`), not just via the effect deps: `augment.kind` is an
  // effect dependency and changes at least once more as it settles from
  // "pending" to its final kind, which would otherwise re-run this effect
  // and double-count the same failed search (mirrors the re-fire discipline
  // #2913/#2918 applied to `search_results_shown`/`search_no_results`).
  useEffect(() => {
    if (!error || isLoading) return;
    if (awaitingSemantic) return;
    if (failureTrackedRef.current) return;

    failureTrackedRef.current = true;
    trackSearchFailed(query.trim(), augment.kind === "answer");
  }, [
    error,
    isLoading,
    awaitingSemantic,
    augment.kind,
    query,
    trackSearchFailed,
  ]);

  /**
   * Handle search submit
   */
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      if (searchQuery.trim()) {
        trackSearchSubmitted(searchQuery.trim());
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
    // Depend on the stable tracker, not `analytics` — this callback is
    // SearchForm's `onSearch` prop, which SearchForm's typeahead-debounce
    // effect lists in its own deps (SearchForm.tsx). A reallocated
    // `handleSearch` on every SearchInterface render was clearing and
    // restarting that 350ms debounce on every unrelated re-render.
    [activeType, router, performSearch, trackSearchSubmitted],
  );

  /**
   * Handle filter change
   * Note: Only updates UI state and URL - no refetch needed since we use client-side filtering
   *
   * Still keyed on the whole `analytics` object (unlike `handleSearch`
   * above, which destructures `trackSearchSubmitted`) rather than a
   * destructured `trackFilterChanged` — `analytics` is a fresh object
   * literal on every render (#2913), so this callback is already recreated
   * every render regardless of what else sits in its deps; destructuring
   * here would be churn without a behavioural payoff.
   */
  const handleFilterChange = useCallback(
    (type: SearchResultType | "all") => {
      // Dedup guard (repo analytics policy, apps/web/CLAUDE.md → Analytics
      // & Instrumentation): re-selecting the already-active chip is a
      // no-op, so neither the URL push nor `search_filter_changed` fires
      // twice (#2449). Compares against the sanitised `activeType`, not the
      // raw `?type=` — an invalid param therefore survives a no-op reselect
      // instead of self-healing. Deliberate: results are already unfiltered
      // in that state, and any genuine filter change rewrites the URL and
      // cleans it up anyway.
      if (type === activeType) return;

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
    [activeType, query, router, analytics],
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
    // Skip when a request for this exact query is already in flight or
    // already resolved as the current result set (#2784). `handleSearch`'s
    // direct `performSearch(searchQuery)` call already covers the common
    // path (submit, and the 350ms typeahead pause in SearchForm) — without
    // this guard, `router.push`'s reactive effect on `useSearchParams()`
    // fires a second, redundant fetch for the same query right behind it.
    // The direct call stays (not removed) specifically so retry-after-error
    // keeps working: re-submitting the identical query pushes an unchanged
    // URL (a `replaceState`, per Next.js), so `currentUrlQueryValue` never
    // changes and this effect never re-fires — the direct call is the only
    // thing that issues the retry's fetch.
    if (lastRequestedQueryRef.current === currentUrlQueryValue) return;
    performSearchRef.current(currentUrlQueryValue);
  }, [currentUrlQueryValue]);

  /**
   * Cleanup: abort any in-flight requests on unmount.
   *
   * Also clears `lastRequestedQueryRef` — an aborted request never resolved,
   * so its query is NOT "covered" the way the guard above assumes. Left
   * unset, React StrictMode's dev-only mount→cleanup→remount cycle (which
   * preserves refs across the cycle) aborts the first pass's in-flight
   * fetch here, then the second pass's URL-watching effect sees the ref
   * still claiming that query is handled and skips re-fetching — the
   * scarf spins forever because the aborted request's own `finally` never
   * clears `isLoading` either (#2784 review). A real unmount doesn't care
   * either way (the component is gone), so this is safe unconditionally.
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        lastRequestedQueryRef.current = null;
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

            {/* Loading State — the scarf. Search is the one sanctioned
                mount (Waiting-Device Rule, DESIGN.md → Motion); every other
                in-flight request uses variant="compact". Explicit here so
                the call site says so, rather than relying on the prop's
                default.

                Also covers `awaitingSemantic` (#2824 review, round 3): once
                the lexical fetch has failed, this slot stays empty until
                the semantic lane settles too (see the notice gate below) —
                without the spinner, that's several seconds of a bare gap on
                a slow LLM call (bounded by the semantic proxy's 15s cap,
                `app/api/search/route.ts`). Keeping the scarf up through
                that wait, then resolving straight to the answer card or the
                notice, means no gap and no flash — never an empty area, and
                never two different "waiting" treatments back to back. Not
                passed to `<SearchForm isLoading>` above — the form (and a
                retry) must stay usable through this wait, only the results
                slot is idle. */}
            {(isLoading || awaitingSemantic) && (
              <div className="flex justify-center py-12">
                <Spinner size="lg" variant="primary" />
              </div>
            )}

            {/* Error state — only <SearchResults> below is gone on this
                branch (filters and "Gerelateerd" links above/below this slot
                are NOT guarded by `error` and keep rendering). tier "surface"
                is still the right register for it: it's the exact same slot
                `<SearchNoResultsCard>` already occupies for the "genuinely
                zero matches" case (also tier "surface",
                SearchNoResultsCard.tsx), so a failed fetch and an empty one
                read as the same weight in the same place, per #2427's tier
                split. No action row: the search form above (in
                <SearchMasthead>) already survives with the query intact, so
                a second "probeer opnieuw" here would be redundant chrome
                (#2470 resolution rule 4). Replaces the ticket-stub <Alert> —
                its last production consumer (#2580). `live="assertive"`
                stays explicit here (tier "surface" has no failure
                discriminant to derive it from, unlike tier "slot"'s
                `reason="unavailable"` — #2815) and matches the
                <Alert variant="error"> this replaces: the visitor just
                pressed "Zoeken", so the failure needs an immediate
                announcement. `emphasis` (#2815) moves the accent off the
                auto-appended period and onto "mislukt" — the failure word,
                not the punctuation.

                `augment.kind !== "answer"` (#2824) is the fourth ratified
                site under DESIGN.md's Silence Is An Answer Rule: when the
                semantic lane already answered the visitor's question (the
                "Slim antwoord" card above), the failed lexical search told
                them nothing they could act on that the answer hadn't
                already recovered, so the notice is suppressed. The low-
                confidence "Gerelateerd" lane (`augment.kind === "related"`)
                is explicitly NOT a recovery — it never suppresses. The
                failure is still counted either way via `search_failed`
                (`useSearchAnalytics`), so suppressing the notice costs no
                visibility.

                `!awaitingSemantic` (`error && !isLoading && augment.kind
                === "pending"`, derived once above and shared with the
                spinner block right above this one) is load-bearing, not
                incidental: the semantic POST debounces 300ms before it even
                starts, so on a genuine failure the lexical GET settles well
                before the semantic lane does. Without this guard the notice
                would render — `live="assertive"` announces it to a screen
                reader immediately — and then vanish moments later once the
                answer arrives, which is precisely what this rule exists to
                avoid (review finding on the first version of this PR). The
                spinner above stays up for exactly that same window (review,
                round 3), so the visitor sees the scarf, never a gap, until
                this resolves one way or the other. See the matching
                `awaitingSemantic` guard on the `search_failed` effect
                above, which the same fix applies to. */}
            {error &&
              !isLoading &&
              !awaitingSemantic &&
              augment.kind !== "answer" && (
                <EmptyState
                  tier="surface"
                  heading="Zoeken mislukt"
                  emphasis={{ text: "mislukt" }}
                  live="assertive"
                >
                  Er ging iets mis bij het zoeken — probeer opnieuw.
                </EmptyState>
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
