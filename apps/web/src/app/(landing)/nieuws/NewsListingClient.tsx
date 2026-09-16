"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import { NewsCard, CategoryFilters } from "@/components/article";
import {
  EmptyState,
  LoadMoreFooter,
  PageContainer,
  TapedCardGrid,
} from "@/components/design-system";
import { formatArticleDate } from "@/lib/utils/dates";
import { articleTypeCardLabel } from "@/lib/utils/article-type-label";
import { narrowParam, writeHistoryFilterParam } from "@/hooks/filterParam";
import { LISTING_BATCH_SIZE, LISTING_INITIAL_TOTAL } from "@/lib/constants";
import { deduplicateById, type Paginated } from "@/lib/utils/pagination";
import {
  filteredEmptyBody,
  pendingEmptyBody,
} from "@/lib/utils/empty-state-copy";

interface Category {
  id: string;
  attributes: { name: string; slug: string };
}

interface NewsListingClientProps {
  initialArticles: ArticleVM[];
  categories: Category[];
  hasMore: boolean;
  initialCategory?: string;
  fetchArticles: (params: {
    offset: number;
    limit: number;
    category?: string;
  }) => Promise<Paginated<ArticleVM>>;
}

export function NewsListingClient({
  initialArticles,
  categories,
  hasMore: initialHasMore,
  initialCategory,
  fetchArticles,
}: NewsListingClientProps) {
  // Every valid `?categorie=` value — the same array both the initial seed
  // below and the `popstate` listener further down narrow against, so a
  // stale/bogus slug (e.g. a category since renamed or removed) can never
  // desync this component's own `activeCategory` from what a
  // `useHistoryFilterParam`-style read would derive (#2783 review finding 4).
  const categorySlugs = useMemo(
    () => categories.map((c) => c.attributes.slug),
    [categories],
  );
  const [activeCategory, setActiveCategory] = useState(() =>
    narrowParam(initialCategory ?? null, categorySlugs, "all"),
  );
  const [gridArticles, setGridArticles] = useState(initialArticles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    retry: () => void;
  } | null>(null);
  const categoryRequestId = useRef(0);
  const isLoadingRef = useRef(false);
  const nextOffsetRef = useRef(initialArticles.length);
  const loadMoreRef = useRef<() => void>(() => {});
  const applyCategoryRef = useRef<
    (category: string, options: { updateUrl: boolean }) => void
  >(() => {});

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return;
    isLoadingRef.current = true;
    const requestId = categoryRequestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const category = activeCategory === "all" ? undefined : activeCategory;
      const offset = nextOffsetRef.current;

      const result = await fetchArticles({
        offset,
        limit: LISTING_BATCH_SIZE,
        category,
      });

      // Discard if a category switch happened while loading
      if (requestId !== categoryRequestId.current) return;

      setGridArticles((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        return [...prev, ...deduplicateById(result.items, existingIds)];
      });
      nextOffsetRef.current += result.items.length;
      setHasMore(result.hasMore);
    } catch (err) {
      if (requestId !== categoryRequestId.current) return;
      console.error("[loadMore] Failed to load articles:", err);
      setError({
        message: "Artikelen laden mislukt.",
        retry: () => {
          setError(null);
          loadMoreRef.current();
        },
      });
    } finally {
      isLoadingRef.current = false;
      if (requestId === categoryRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [hasMore, activeCategory, fetchArticles]);

  // Fetches a category's first batch and (optionally) writes the URL. Shared
  // by the chip click-handler and the `popstate` listener below, so both a
  // forward chip click and a browser back/forward press run through exactly
  // one fetch — never `router.push`'s server round-trip on top of it.
  //
  // `/nieuws` awaits `searchParams` server-side (page.tsx), which makes the
  // segment dynamic like `force-dynamic`. `router.push`ing a `?categorie=`
  // change there re-runs the server page — a second, redundant
  // `fetchArticlesAction` — and, while that resolves, Next shows
  // `loading.tsx` and unmounts this component, discarding the grid the
  // client fetch above just built (#2564 review finding 3, reproduced: every
  // chip click fired two fetches and flashed the loading skeleton).
  // `writeHistoryFilterParam` (#2779, #2783 review finding 5) writes
  // `window.history.pushState` instead — updating the address bar and
  // adding a real history entry (browser back undoes a filter, #2429
  // resolution rule 5) without going through Next's router at all, so no
  // server re-render, no second fetch, no discarded grid. Called directly
  // as a plain function, not through `useHistoryFilterParam`'s own
  // read/mount-effect/`popstate` machinery: this component's own async
  // orchestration (request-id tracking, abort-on-stale, retry-on-error)
  // already owns the read side (`activeCategory` above), so routing a
  // discarded reactive value through that hook for a read nothing renders
  // with would only run a second, weaker-narrowed popstate listener
  // alongside this one. The URL write stays gated on fetch SUCCESS and
  // happens only here, after the grid is already updated — never in the
  // click handler itself. Because a `pushState`-driven write doesn't itself
  // notify React, the `popstate` listener below re-runs this same fetch
  // (with `updateUrl: false`, since the browser already moved the URL) so
  // back/forward doesn't leave the grid out of sync with the address bar.
  const applyCategory = useCallback(
    async (category: string, { updateUrl }: { updateUrl: boolean }) => {
      if (category === activeCategory) return;
      const prevCategory = activeCategory;
      const requestId = ++categoryRequestId.current;
      setActiveCategory(category);
      setIsLoading(true);
      setError(null);

      const categoryFilter = category === "all" ? undefined : category;

      try {
        const result = await fetchArticles({
          offset: 0,
          limit: LISTING_INITIAL_TOTAL,
          category: categoryFilter,
        });

        // Ignore stale responses from superseded category switches
        if (requestId !== categoryRequestId.current) return;

        setGridArticles(deduplicateById(result.items, new Set()));
        nextOffsetRef.current = result.items.length;
        setHasMore(result.hasMore);

        if (updateUrl) {
          writeHistoryFilterParam("categorie", category, "all", {
            route: "/nieuws",
          });
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        if (requestId !== categoryRequestId.current) return;
        setActiveCategory(prevCategory);
        console.error("[handleCategoryChange] Failed to load articles:", err);
        setError({
          message: "Artikelen laden mislukt.",
          retry: () => {
            setError(null);
            applyCategoryRef.current(category, { updateUrl: true });
          },
        });
      } finally {
        if (requestId === categoryRequestId.current) {
          setIsLoading(false);
        }
      }
    },
    [activeCategory, fetchArticles],
  );

  // Chip click / "Toon alles" undo — the URL-writing path.
  const handleCategoryChange = useCallback(
    (category: string) => applyCategory(category, { updateUrl: true }),
    [applyCategory],
  );

  useEffect(() => {
    loadMoreRef.current = loadMore;
    applyCategoryRef.current = applyCategory;
  }, [loadMore, applyCategory]);

  // Browser back/forward — re-applies the URL's `?categorie=` WITHOUT
  // writing it again (the browser already moved it). Reads through a ref so
  // this listener attaches once, not on every category change.
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      // Narrowed the same way `useHistoryFilterParam` narrows its own read
      // (#2783 review finding 4) — an unrecognised/stale `?categorie=` (a
      // category since renamed or removed) falls back to "all" here too,
      // rather than being handed to `applyCategory` raw. Without this, a
      // bogus slug in the URL and this component's own `activeCategory`
      // could disagree forever: clicking "Toon alles" would see
      // `activeCategory` (bogus) differ from "all" and proceed, but nothing
      // would ever clear the bogus value FROM the address bar, since the
      // resulting write always narrows the WRITE side to "all" too.
      const urlCategory = narrowParam(
        params.get("categorie"),
        categorySlugs,
        "all",
      );
      applyCategoryRef.current(urlCategory, { updateUrl: false });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [categorySlugs]);

  // The filtered EmptyState's undo action — defined here, not inline in the
  // JSX below, so the callback closes over `handleCategoryChange` at the
  // component's top level rather than inside the render-time IIFE that
  // computes `activeCategoryLabel`.
  const undoAllCategories = useCallback(
    () => handleCategoryChange("all"),
    [handleCategoryChange],
  );
  const undoAction = useMemo(
    () => ({
      label: "Toon alles",
      onClick: undoAllCategories,
      analyticsSource: "nieuws" as const,
      analyticsFacet: activeCategory,
    }),
    [undoAllCategories, activeCategory],
  );

  const isEmpty = gridArticles.length === 0 && !isLoading;

  return (
    <div className="w-full">
      {/* Sticky filter bar — paper ground, matching <TeamSectionNav>'s sticky
          row (#2805): opaque cream + ink bottom rule, no translucency or
          blur. The bar previously sat on `bg-ink/95`, a pre-redesign
          leftover nothing in DESIGN.md ever authorised — on it the active
          "Alles" chip's ink-on-ink fill vanished and `<ScrollRail>`'s
          default cream fade read as a mismatched yellowish band.
          `top-[var(--sticky-header-h)]` (not `top-0`, #2487): `<SiteHeader>`
          is itself `sticky top-0 z-50` with an opaque `bg-cream` — at
          `top-0` this bar parked entirely behind the header once both
          stuck, and once it also shared the header's `bg-cream` the
          occlusion was total. The token (65px) — not the hand-written
          `top-16` (64px) this bar used to sit at, one pixel short of the
          header's true height because `<SiteHeader>` derives its own height
          as `calc(var(--sticky-header-h) - 1px)`, the missing pixel being
          its own `border-b` (#2820) — clears the header exactly, same notch
          `<TeamSectionNav>` and `<OrganigramSectionNav>` already use below
          the same header via `SECTION_NAV_BAR_CLASSES`. This bar keeps its
          own class string (not that constant) because its `bg-cream` ground is a
          filter bar, not a section nav — background is a purpose
          difference, not a value to flatten. z-index and padding are
          unchanged. */}
      <div className="border-ink bg-cream sticky top-[var(--sticky-header-h)] z-30 border-b-2 py-3">
        <PageContainer width="index">
          <CategoryFilters
            categories={categories}
            activeCategory={
              activeCategory === "all" ? undefined : activeCategory
            }
            renderAsLinks={false}
            onChange={handleCategoryChange}
          />
        </PageContainer>
      </div>

      <PageContainer width="index" className="py-6">
        {/* One chronological grid — an archive is chronological. The
            "Uitgelicht." row this page used to open with was
            `articles.slice(0, 3)` relabelled, so nothing curated it and the
            same three headed the grid anyway; `Uitgelicht` survives on the
            homepage, where it is editorially chosen (#2569 / decision #2431). */}
        {/* The grid renders nothing of its own when the list is empty, so the
            empty state below is the only branch this page needs. */}
        <TapedCardGrid columns={3} gap="md" className="mb-6">
          {gridArticles.map((article) => (
            <NewsCard
              key={article.id}
              title={article.title}
              href={`/nieuws/${article.slug}`}
              imageUrl={article.coverImageUrl ?? undefined}
              badge={article.tags[0] ?? undefined}
              typeLabel={articleTypeCardLabel(article.articleType)}
              date={
                article.publishedAt
                  ? formatArticleDate(new Date(article.publishedAt))
                  : undefined
              }
            />
          ))}
        </TapedCardGrid>

        {/* Empty state. `activeCategoryLabel` is resolved here, not hoisted —
            the `.find()` it runs has no reason to pay for itself on every
            render of an infinite-scroll page when it's read only in this
            branch (#2562 review round 3, D6). */}
        {isEmpty &&
          !error &&
          (() => {
            // Names the active facet by label ("Jeugd"), not a generic
            // "deze categorie" — the copy is the tell (#2427 rule 5). `null`
            // for "all", which is genuine emptiness, not a filter having
            // emptied the surface. `activeCategory` holds a SLUG
            // (`CategoryFilters` builds its tab values from
            // `category.attributes.slug`, and `initialCategory` comes from
            // the `?categorie=` slug) — match on slug, not `id`. The two
            // look interchangeable today only because `nieuws/page.tsx`
            // currently synthesises `{ id: tag, attributes: { name: tag,
            // slug: tag } }` (#2562 review).
            const activeCategoryLabel =
              activeCategory === "all"
                ? null
                : (categories.find((c) => c.attributes.slug === activeCategory)
                    ?.attributes.name ?? activeCategory);

            return activeCategoryLabel ? (
              <EmptyState
                tier="surface"
                heading={`Geen artikelen in ${activeCategoryLabel}`}
                live
                reason="filtered"
                undo={undoAction}
                className="mb-6"
              >
                {filteredEmptyBody("het volledige overzicht")}
              </EmptyState>
            ) : (
              <EmptyState
                tier="surface"
                heading="Nog geen artikelen"
                live
                className="mb-6"
              >
                {pendingEmptyBody("we een artikel publiceren", "het")}
              </EmptyState>
            );
          })()}

        {/* Error retry · in-flight spinner · load-more (NEWS-1, #2237 —
            replaces the old infinite scroll). Appends LISTING_BATCH_SIZE
            more articles per click. */}
        <LoadMoreFooter
          label="Meer nieuws laden"
          hasMore={hasMore}
          isLoading={isLoading}
          error={error?.message}
          errorEmphasis="mislukt"
          onLoadMore={error ? error.retry : loadMore}
        />
      </PageContainer>
    </div>
  );
}
