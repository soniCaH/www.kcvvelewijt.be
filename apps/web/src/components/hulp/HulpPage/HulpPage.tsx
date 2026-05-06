"use client";

/**
 * HulpPage — content-only orchestration for the /hulp page
 *
 * Renders the search input, browse/search/answer views, and closing CTA.
 * The InteriorPageHero and SectionStack layout are owned by the server layer
 * (`page.tsx`) so the hero streams immediately and the data-dependent
 * content loads inside a Suspense boundary.
 *
 * Three view modes (selected by URL + search state):
 *
 *   1. **Browse** — default; shows all paths grouped by category
 *   2. **Search results** — when the user types in the search input
 *   3. **Answer** — when a question is selected via the `?id=` URL param
 *
 * URL state is the source of truth for the selected question. Search
 * state stays purely client-side (no `?q=` param) to keep the URL
 * shareable as "this answer" rather than "this query".
 *
 * Analytics: reuses the existing `useResponsibilityAnalytics` hook —
 * search, suggestion click, contact click, and step-link click events
 * fire with the same shape as the legacy ResponsibilityFinder.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useResponsibilityAnalytics } from "@/hooks/useResponsibilityAnalytics";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { sanitizeQuery } from "@/lib/analytics/sanitize-query";
import type { ResponsibilityPath } from "@/types/responsibility";
import { HulpSearchInput } from "./HulpSearchInput";
import { BrowseContent } from "./BrowseContent";
import { CategorySection } from "./CategorySection";
import { AnswerCard } from "./AnswerCard";
import { QuestionCardSkeletonGrid } from "./QuestionCardSkeleton";
import {
  CATEGORY_ORDER,
  groupPathsByCategory,
  type CategoryKey,
} from "./categoryMeta";

export interface HulpPageProps {
  paths: ResponsibilityPath[];
}

const URL_PARAM = "id";
const MIN_QUERY_LENGTH = 2;

/**
 * Inline contact-CTA card used in two places on the page: the empty-data
 * fallback (when Sanity returns no responsibility paths) and the closing
 * "still no answer?" callout below the browse/search content. Kept local
 * to HulpPage because it has no other consumers.
 */
function ContactCtaCard({
  heading,
  body,
  centered = false,
  role,
}: {
  heading: string;
  body: string;
  centered?: boolean;
  role?: "status";
}) {
  return (
    <div
      role={role}
      className={
        centered
          ? "border-kcvv-green-bright mx-auto max-w-2xl rounded-sm border-l-4 bg-white p-6 text-center shadow-sm md:p-8"
          : "border-kcvv-green-bright mx-auto max-w-2xl rounded-sm border-l-4 bg-white p-6 shadow-sm md:p-8"
      }
    >
      <h2 className="font-title text-kcvv-black text-2xl leading-tight font-bold uppercase">
        {heading}
      </h2>
      <p className="text-kcvv-gray mt-2 text-sm">{body}</p>
      <a
        href="mailto:info@kcvvelewijt.be"
        className="bg-kcvv-green-bright text-kcvv-black hover:bg-kcvv-green-dark mt-4 inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-sm font-bold tracking-[0.05em] uppercase transition-colors hover:text-white"
      >
        Contact opnemen
      </a>
    </div>
  );
}

export function HulpPage({ paths }: HulpPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");

  // Destructure the analytics callbacks at the call site so the effect
  // and click handlers can depend on the stable `useCallback` references
  // directly. The wrapping object returned by `useResponsibilityAnalytics`
  // is a fresh literal every render, so depending on `analytics` would
  // cause every parent re-render to re-fire the analytics effect (and
  // emit duplicate trackSearch / trackNoResults events).
  const {
    trackSearch,
    trackNoResults,
    trackSuggestionClicked,
    trackContactClicked,
    trackStepLinkClicked,
  } = useResponsibilityAnalytics();

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    executedQuery,
    search,
    clear: clearSearch,
  } = useSemanticSearch({ type: "responsibility", limit: 10 });

  const pathById = useMemo(() => {
    const map = new Map<string, ResponsibilityPath>();
    for (const p of paths) map.set(p.id, p);
    return map;
  }, [paths]);

  const pathsByCategory = useMemo(() => groupPathsByCategory(paths), [paths]);

  const selectedIdParam = searchParams.get(URL_PARAM);
  // When the user starts typing, the answer view should give way to the
  // search view — but we don't aggressively rewrite the URL on every
  // keystroke (that would clutter browser history). Instead, override the
  // selectedPath at render time when a search is active, and clear the
  // URL param the next time `searchQuery` actually has a value (see the
  // search-trigger effect below).
  const selectedPath =
    selectedIdParam && searchQuery.trim().length === 0
      ? (pathById.get(selectedIdParam) ?? null)
      : null;

  // Trigger debounced semantic search when the query changes. Also clear
  // the `?id=` URL param the moment a query becomes non-empty, so the
  // shareable URL stays consistent with what the user actually sees.
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length === 0) {
      clearSearch();
      return;
    }
    if (selectedIdParam) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(URL_PARAM);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }
    if (trimmed.length < MIN_QUERY_LENGTH) {
      clearSearch();
      return;
    }
    search(trimmed);
  }, [
    searchQuery,
    search,
    clearSearch,
    selectedIdParam,
    pathname,
    router,
    searchParams,
  ]);

  // Map semantic search results back to full ResponsibilityPath records.
  // The Vectorize index keys vectors by Sanity `_id` and stores the slug
  // as metadata, while `path.id` here is the slug (see
  // ResponsibilityRepository — `"id": slug.current`). Match by slug first
  // (the common case for responsibility hits), then fall back to id so
  // local fixtures and any future indexers that key by slug both work.
  //
  // Gated on `executedQuery` (the query that produced the current results)
  // rather than `searchQuery` (the live input value) so the UI doesn't
  // flash "Geen resultaten" during the hook's debounce window.
  const filteredPaths = useMemo<ResponsibilityPath[]>(() => {
    if (executedQuery.length === 0) return [];
    return searchResults
      .map((r) => pathById.get(r.slug) ?? pathById.get(r.id))
      .filter((p): p is ResponsibilityPath => p !== undefined);
  }, [executedQuery, searchResults, pathById]);

  // Group filtered results by category so we can reuse `<CategorySection>`
  // for the search-results view (preserves visual consistency with browse).
  const filteredByCategory = useMemo(
    () => groupPathsByCategory(filteredPaths),
    [filteredPaths],
  );

  // Flatten the currently-rendered grouped order so analytics positions
  // match the visible card order, not the raw fetch order from Sanity.
  const renderedOrder = useMemo<ResponsibilityPath[]>(() => {
    const grouped =
      filteredPaths.length > 0 ? filteredByCategory : pathsByCategory;
    return CATEGORY_ORDER.flatMap((cat) => grouped[cat]);
  }, [filteredPaths.length, filteredByCategory, pathsByCategory]);

  // Analytics: search event fires when results settle. Gating on
  // `executedQuery` (instead of the raw `searchQuery`) means the effect
  // fires once per settled fetch, never during the debounce window. The
  // dependency list intentionally omits the wrapping `analytics` object —
  // see the destructure above for rationale.
  //
  // The query is wrapped in `sanitizeQuery` at the call site. The current
  // `useResponsibilityAnalytics` hook only forwards `query.length` — the
  // text never reaches the wire — but sanitizing here is the project
  // convention for any user-generated input passed into an analytics
  // function (see apps/web/CLAUDE.md), and it future-proofs the call site
  // against hook changes that might later forward the text.
  useEffect(() => {
    if (executedQuery.length === 0) return;
    if (searchLoading || searchError) return;
    const safeQuery = sanitizeQuery(executedQuery);
    if (filteredPaths.length === 0) {
      trackNoResults(safeQuery.length, "all");
    } else {
      trackSearch(safeQuery, "all", filteredPaths.length);
    }
  }, [
    executedQuery,
    searchLoading,
    searchError,
    filteredPaths.length,
    trackSearch,
    trackNoResults,
  ]);

  const handlePathClick = useCallback(
    (id: string) => {
      if (id === selectedIdParam) return; // dedup guard
      // Leave search mode before pushing the ?id param. Without this, the
      // search-trigger effect would see (searchQuery non-empty + new
      // selectedIdParam) and strip ?id back out via router.replace, then
      // re-fire the semantic search — leaving the user stuck on the
      // results view. See issue #1238 for full root-cause trace.
      setSearchQuery("");
      // Intentionally eager — the search-trigger effect would also call
      // clearSearch() after setSearchQuery("") propagates, but we clear
      // now so the search state is already gone before router.push fires.
      clearSearch();
      const params = new URLSearchParams(searchParams.toString());
      params.set(URL_PARAM, id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      const path = pathById.get(id);
      if (path) {
        const index = renderedOrder.findIndex((p) => p.id === id);
        trackSuggestionClicked(id, path.category, Math.max(0, index));
      }
    },
    [
      trackSuggestionClicked,
      renderedOrder,
      pathById,
      pathname,
      router,
      searchParams,
      selectedIdParam,
      clearSearch,
    ],
  );

  const handleBack = useCallback(() => {
    if (!selectedIdParam) return; // dedup guard
    const params = new URLSearchParams(searchParams.toString());
    params.delete(URL_PARAM);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedIdParam]);

  const handleContactClick = useCallback(
    (channel: "email" | "phone") => {
      if (!selectedPath) return;
      trackContactClicked(selectedPath.id, channel);
    },
    [trackContactClicked, selectedPath],
  );

  const handleStepLinkClick = useCallback(
    (stepIndex: number) => {
      if (!selectedPath) return;
      trackStepLinkClicked(selectedPath.id, stepIndex);
    },
    [trackStepLinkClicked, selectedPath],
  );

  const renderContent = () => {
    if (selectedPath) {
      return (
        <AnswerCard
          path={selectedPath}
          onBackClick={handleBack}
          onContactClick={handleContactClick}
          onStepLinkClick={handleStepLinkClick}
        />
      );
    }

    // Genuinely empty data set (e.g. Sanity returned no responsibility
    // paths). Browse and search would both render blank, so show an
    // explicit fallback instead of leaving the page mostly empty.
    if (paths.length === 0) {
      return (
        <ContactCtaCard
          centered
          role="status"
          heading="Nog geen vragen beschikbaar"
          body="We zijn de hulppagina aan het vullen. Stuur ons in de tussentijd gerust een bericht."
        />
      );
    }

    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH) {
      return (
        <p
          role="status"
          aria-live="polite"
          className="text-kcvv-gray text-center text-sm"
        >
          Typ minstens {MIN_QUERY_LENGTH} letters…
        </p>
      );
    }

    if (trimmedQuery.length > 0) {
      // Show the skeleton when the search is in flight OR the debounce
      // window is open (executedQuery still lagging searchQuery). When
      // stale results exist, keep them visible with a subtle opacity
      // reduction instead of replacing them with a skeleton grid — this
      // avoids a content flash on every keystroke during query refinement.
      // Only show the full skeleton when there are no stale results to
      // display. See issue #1238.
      const isAwaitingResults = searchLoading || executedQuery !== trimmedQuery;

      if (isAwaitingResults && filteredPaths.length === 0) {
        return <QuestionCardSkeletonGrid count={4} />;
      }

      if (searchError) {
        // Render the error inline AND fall through to the browse content
        // below — the message tells the user to "blader hieronder door
        // alle categorieën", so the categories must actually be visible.
        return (
          <div className="space-y-12">
            <p className="text-kcvv-gray text-center text-sm">
              Er ging iets mis bij het zoeken. Probeer het opnieuw of blader
              door de categorieën hieronder.
            </p>
            <BrowseContent
              pathsByCategory={pathsByCategory}
              onPathClick={handlePathClick}
            />
          </div>
        );
      }

      if (filteredPaths.length === 0) {
        return (
          <div role="status" aria-live="polite" className="space-y-12">
            <p className="text-kcvv-gray text-center text-sm">
              Geen resultaten voor &quot;{executedQuery}&quot;. Blader hieronder
              door alle categorieën.
            </p>
            <BrowseContent
              pathsByCategory={pathsByCategory}
              onPathClick={handlePathClick}
            />
          </div>
        );
      }

      return (
        <div
          className={`space-y-12 transition-opacity duration-150 ${isAwaitingResults ? "pointer-events-none opacity-50" : ""}`}
        >
          {CATEGORY_ORDER.map((category: CategoryKey) => (
            <CategorySection
              key={category}
              category={category}
              paths={filteredByCategory[category]}
              onPathClick={handlePathClick}
            />
          ))}
        </div>
      );
    }

    return (
      <BrowseContent
        pathsByCategory={pathsByCategory}
        onPathClick={handlePathClick}
      />
    );
  };

  return (
    <>
      <div>
        <HulpSearchInput value={searchQuery} onChange={setSearchQuery} />
        <p className="text-kcvv-gray mt-3 text-center text-xs">
          Tip: probeer trefwoorden zoals <em>inschrijving</em>,{" "}
          <em>sportongeval</em>, of <em>transfer</em>.
        </p>
      </div>
      {renderContent()}

      {/* Closing "still no answer?" callout — sits inside the gray
          content section so the page footer's diagonal transition
          flows directly out of gray. Avoids the green→gray→green
          sandwich a separate CTA section would create above the
          footer. Suppressed when `paths` is empty since the empty-
          data state already shows its own contact CTA. */}
      {paths.length > 0 && (
        <ContactCtaCard
          heading="Niet gevonden wat je zocht?"
          body="Stuur ons een bericht en we helpen je graag verder."
        />
      )}
    </>
  );
}
