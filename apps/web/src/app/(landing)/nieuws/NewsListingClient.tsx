"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import { NewsCard, CategoryFilters } from "@/components/article";
import { formatArticleDate } from "@/lib/utils/dates";
import type { PaginatedArticles } from "./utils";
import { deduplicateById } from "./utils";
import { BATCH_SIZE, INITIAL_TOTAL } from "./constants";

interface Category {
  id: string;
  attributes: { name: string; slug: string };
}

interface NewsListingClientProps {
  featuredArticles: ArticleVM[];
  initialArticles: ArticleVM[];
  categories: Category[];
  hasMore: boolean;
  initialCategory?: string;
  fetchArticles: (params: {
    offset: number;
    limit: number;
    category?: string;
  }) => Promise<PaginatedArticles>;
}

export function NewsListingClient({
  featuredArticles: initialFeatured,
  initialArticles,
  categories,
  hasMore: initialHasMore,
  initialCategory,
  fetchArticles,
}: NewsListingClientProps) {
  const [activeCategory, setActiveCategory] = useState(
    initialCategory ?? "all",
  );
  const [featuredArticles, setFeaturedArticles] = useState(initialFeatured);
  const [gridArticles, setGridArticles] = useState(initialArticles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    retry: () => void;
  } | null>(null);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const categoryRequestId = useRef(0);
  const isLoadingRef = useRef(false);
  const featuredIdsRef = useRef(new Set(initialFeatured.map((a) => a.id)));
  const nextOffsetRef = useRef(initialFeatured.length + initialArticles.length);
  const loadMoreRef = useRef<() => void>(() => {});
  const handleCategoryChangeRef = useRef<(category: string) => void>(() => {});

  useEffect(() => {
    featuredIdsRef.current = new Set(featuredArticles.map((a) => a.id));
  }, [featuredArticles]);

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
        limit: BATCH_SIZE,
        category,
      });

      // Discard if a category switch happened while loading
      if (requestId !== categoryRequestId.current) return;

      setGridArticles((prev) => {
        const existingIds = new Set([
          ...featuredIdsRef.current,
          ...prev.map((a) => a.id),
        ]);
        return [...prev, ...deduplicateById(result.articles, existingIds)];
      });
      nextOffsetRef.current += result.articles.length;
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

  // Intersection Observer for infinite scroll — reattaches whenever the
  // sentinel DOM node changes (remount via hasMore/isLoading/error toggling).
  useEffect(() => {
    if (!sentinelNode) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelNode);
    return () => observer.unobserve(sentinelNode);
  }, [sentinelNode, loadMore]);

  // Category change handler
  const handleCategoryChange = useCallback(
    async (category: string) => {
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
          limit: INITIAL_TOTAL,
          category: categoryFilter,
        });

        // Ignore stale responses from superseded category switches
        if (requestId !== categoryRequestId.current) return;

        const uniqueArticles = deduplicateById(result.articles, new Set());
        const featured = uniqueArticles.slice(0, 3);
        const grid = uniqueArticles.slice(3);

        setFeaturedArticles(featured);
        setGridArticles(grid);
        nextOffsetRef.current = result.articles.length;
        setHasMore(result.hasMore);

        // Update URL and scroll only after successful fetch
        const url = categoryFilter
          ? `/nieuws?categorie=${encodeURIComponent(categoryFilter)}`
          : "/nieuws";
        window.history.replaceState({}, "", url);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        if (requestId !== categoryRequestId.current) return;
        setActiveCategory(prevCategory);
        console.error("[handleCategoryChange] Failed to load articles:", err);
        setError({
          message: "Artikelen laden mislukt.",
          retry: () => {
            setError(null);
            handleCategoryChangeRef.current(category);
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

  useEffect(() => {
    loadMoreRef.current = loadMore;
    handleCategoryChangeRef.current = handleCategoryChange;
  }, [loadMore, handleCategoryChange]);

  const renderCard = (
    article: ArticleVM,
    variant: "featured" | "standard" | "listing",
    className?: string,
  ) => (
    <NewsCard
      key={article.id}
      variant={variant}
      className={className}
      title={article.title}
      href={`/nieuws/${article.slug}`}
      imageUrl={article.coverImageUrl ?? undefined}
      imageAlt={article.title}
      badge={article.tags[0] ?? undefined}
      date={
        article.publishedAt
          ? formatArticleDate(new Date(article.publishedAt))
          : undefined
      }
    />
  );

  const isEmpty =
    featuredArticles.length === 0 && gridArticles.length === 0 && !isLoading;

  return (
    <div className="w-full">
      {/* Sticky filter bar */}
      <div className="bg-kcvv-dark-bg/95 sticky top-0 z-30 border-b border-white/10 py-3 backdrop-blur-sm">
        <div className="max-w-inner-lg mx-auto px-3 lg:px-0">
          <CategoryFilters
            categories={categories}
            activeCategory={
              activeCategory === "all" ? undefined : activeCategory
            }
            renderAsLinks={false}
            onChange={handleCategoryChange}
          />
        </div>
      </div>

      <div className="max-w-inner-lg mx-auto px-3 py-6 lg:px-0">
        {/* Featured split: 2fr | 1fr */}
        {featuredArticles.length > 0 && (
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Main featured article — 2fr */}
            <div className="md:col-span-2">
              {featuredArticles[0] &&
                renderCard(featuredArticles[0], "featured")}
            </div>
            {/* Right stack — 1fr, 2 stacked standard cards that split the featured card's height */}
            <div className="flex flex-col gap-4">
              {featuredArticles
                .slice(1, 3)
                .map((article) =>
                  renderCard(article, "standard", "flex-1 aspect-auto"),
                )}
            </div>
          </section>
        )}

        {/* Grid of listing cards */}
        {gridArticles.length > 0 && (
          <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gridArticles.map((article) => renderCard(article, "listing"))}
          </section>
        )}

        {/* Error state with retry */}
        {error && (
          <div className="py-4 text-center">
            <p className="mb-2 text-red-400">{error.message}</p>
            <button
              type="button"
              className="text-kcvv-green-bright text-sm underline hover:no-underline"
              onClick={error.retry}
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && !error && (
          <p className="py-12 text-center text-gray-400">
            Geen artikelen gevonden voor deze categorie.
          </p>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-8" role="status">
            <div className="border-kcvv-green-bright h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            <span className="sr-only">Laden...</span>
          </div>
        )}

        {/* Intersection Observer sentinel */}
        {hasMore && !isLoading && !error && (
          <div ref={setSentinelNode} className="h-4" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
