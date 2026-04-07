"use client";

/**
 * HulpPage — top-level orchestration for the redesigned /hulp page
 *
 * Composes a `SectionStack` with hero / content / CTA sections. The
 * content section switches between three views:
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
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import { useResponsibilityAnalytics } from "@/hooks/useResponsibilityAnalytics";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import type { ResponsibilityPath } from "@/types/responsibility";
import { HulpSearchInput } from "./HulpSearchInput";
import { BrowseContent } from "./BrowseContent";
import { CategorySection } from "./CategorySection";
import { AnswerCard } from "./AnswerCard";
import {
  CATEGORY_ORDER,
  groupPathsByCategory,
  type CategoryKey,
} from "./categoryMeta";

export interface HulpPageProps {
  paths: ResponsibilityPath[];
}

const URL_PARAM = "id";

export function HulpPage({ paths }: HulpPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");

  const analytics = useResponsibilityAnalytics();
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    clear: clearSearch,
  } = useSemanticSearch({ type: "responsibility", limit: 10 });

  const pathById = useMemo(() => {
    const map = new Map<string, ResponsibilityPath>();
    for (const p of paths) map.set(p.id, p);
    return map;
  }, [paths]);

  const pathsByCategory = useMemo(() => groupPathsByCategory(paths), [paths]);

  const selectedId = searchParams.get(URL_PARAM);
  const selectedPath = selectedId ? (pathById.get(selectedId) ?? null) : null;

  // Trigger debounced semantic search when the query changes.
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      clearSearch();
      return;
    }
    search(searchQuery);
  }, [searchQuery, search, clearSearch]);

  // Map semantic search results back to full ResponsibilityPath records.
  const filteredPaths = useMemo<ResponsibilityPath[]>(() => {
    if (searchQuery.trim().length === 0) return [];
    return searchResults
      .map((r) => pathById.get(r.id))
      .filter((p): p is ResponsibilityPath => p !== undefined);
  }, [searchQuery, searchResults, pathById]);

  // Group filtered results by category so we can reuse `<CategorySection>`
  // for the search-results view (preserves visual consistency with browse).
  const filteredByCategory = useMemo(
    () => groupPathsByCategory(filteredPaths),
    [filteredPaths],
  );

  // Analytics: search event fires when results settle (loading=false, error=null).
  // Guarding on `searchLoading` and `searchError` is required by the project's
  // analytics conventions (see apps/web/CLAUDE.md).
  useEffect(() => {
    if (searchQuery.trim().length === 0) return;
    if (searchLoading || searchError) return;
    if (filteredPaths.length === 0) {
      analytics.trackNoResults(searchQuery.length, "all");
    } else {
      analytics.trackSearch(searchQuery, "all", filteredPaths.length);
    }
  }, [
    searchQuery,
    searchLoading,
    searchError,
    filteredPaths.length,
    analytics,
  ]);

  const handlePathClick = useCallback(
    (id: string) => {
      if (id === selectedId) return; // dedup guard
      const params = new URLSearchParams(searchParams.toString());
      params.set(URL_PARAM, id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      const path = pathById.get(id);
      if (path) {
        const index =
          filteredPaths.length > 0
            ? filteredPaths.findIndex((p) => p.id === id)
            : paths.findIndex((p) => p.id === id);
        analytics.trackSuggestionClicked(id, path.category, Math.max(0, index));
      }
    },
    [
      analytics,
      filteredPaths,
      paths,
      pathById,
      pathname,
      router,
      searchParams,
      selectedId,
    ],
  );

  const handleBack = useCallback(() => {
    if (!selectedId) return; // dedup guard
    const params = new URLSearchParams(searchParams.toString());
    params.delete(URL_PARAM);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedId]);

  const handleContactClick = useCallback(
    (channel: "email" | "phone") => {
      if (!selectedPath) return;
      analytics.trackContactClicked(selectedPath.id, channel);
    },
    [analytics, selectedPath],
  );

  const handleStepLinkClick = useCallback(
    (stepIndex: number) => {
      if (!selectedPath) return;
      analytics.trackStepLinkClicked(selectedPath.id, stepIndex);
    },
    [analytics, selectedPath],
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

    if (searchQuery.trim().length > 0) {
      if (searchLoading && filteredPaths.length === 0) {
        return <p className="text-center text-sm text-kcvv-gray">Zoeken...</p>;
      }

      if (searchError) {
        return (
          <p className="text-center text-sm text-kcvv-gray">
            Er ging iets mis bij het zoeken. Probeer het opnieuw of blader door
            de categorieën hieronder.
          </p>
        );
      }

      if (filteredPaths.length === 0) {
        return (
          <div className="space-y-12">
            <p className="text-center text-sm text-kcvv-gray">
              Geen resultaten voor &quot;{searchQuery}&quot;. Blader hieronder
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
        <div className="space-y-12">
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

  const sections: SectionConfig[] = [
    {
      key: "hero",
      bg: "kcvv-black",
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      content: (
        <PageHero
          size="compact"
          gradient="dark"
          label="Help"
          headline="Vind de juiste persoon"
          body="Stel je vraag of blader door de categorieën hieronder."
        />
      ),
      transition: { type: "diagonal", direction: "right", overlap: "full" },
    },
    {
      key: "content",
      bg: "gray-100",
      content: (
        <div className="mx-auto max-w-inner-lg space-y-12 px-4 md:px-10">
          <div>
            <HulpSearchInput value={searchQuery} onChange={setSearchQuery} />
            <p className="mt-3 text-center text-xs text-kcvv-gray">
              Tip: probeer trefwoorden zoals <em>inschrijving</em>,{" "}
              <em>sportongeval</em>, of <em>transfer</em>.
            </p>
          </div>
          {renderContent()}
        </div>
      ),
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "cta",
      bg: "kcvv-green-dark",
      paddingTop: "pt-16",
      paddingBottom: "pb-16",
      content: (
        <SectionCta
          variant="dark"
          heading="Niet gevonden wat je zocht?"
          body="Stuur ons een bericht en we helpen je graag verder."
          buttonLabel="Contact opnemen"
          buttonHref="mailto:info@kcvvelewijt.be"
        />
      ),
    },
  ];

  return <SectionStack sections={sections} />;
}
