"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SanityArticle } from "@/lib/effect/services/SanityService";
import { NewsCard, CategoryFilters } from "@/components/article";
import { formatArticleDate } from "@/lib/utils/dates";
import type { PaginatedArticles } from "./utils";

interface Category {
  id: string;
  attributes: { name: string; slug: string };
}

interface NewsListingClientProps {
  featuredArticles: SanityArticle[];
  initialArticles: SanityArticle[];
  categories: Category[];
  hasMore: boolean;
  initialCategory?: string;
  fetchArticles: (params: {
    offset: number;
    limit: number;
    category?: string;
  }) => Promise<PaginatedArticles>;
}

const BATCH_SIZE = 6;

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
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const category = activeCategory === "all" ? undefined : activeCategory;
      const offset = featuredArticles.length + gridArticles.length;

      const result = await fetchArticles({
        offset,
        limit: BATCH_SIZE,
        category,
      });

      setGridArticles((prev) => [...prev, ...result.articles]);
      setHasMore(result.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    hasMore,
    activeCategory,
    featuredArticles.length,
    gridArticles.length,
    fetchArticles,
  ]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Category change handler
  const handleCategoryChange = useCallback(
    async (category: string) => {
      setActiveCategory(category);
      setIsLoading(true);
      setGridArticles([]);
      setFeaturedArticles([]);
      setHasMore(false);

      const categoryFilter = category === "all" ? undefined : category;

      // Update URL without navigation
      const url = categoryFilter
        ? `/news?category=${encodeURIComponent(categoryFilter)}`
        : "/news";
      window.history.replaceState({}, "", url);

      try {
        // Fetch initial batch for new category
        const INITIAL_TOTAL = 9;
        const result = await fetchArticles({
          offset: 0,
          limit: INITIAL_TOTAL,
          category: categoryFilter,
        });

        const featured = result.articles.slice(0, 3);
        const grid = result.articles.slice(3);

        setFeaturedArticles(featured);
        setGridArticles(grid);
        setHasMore(result.hasMore);
      } finally {
        setIsLoading(false);
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fetchArticles],
  );

  const renderCard = (
    article: SanityArticle,
    variant: "featured" | "standard" | "listing",
  ) => (
    <NewsCard
      key={article._id}
      variant={variant}
      title={article.title}
      href={`/news/${article.slug.current}`}
      imageUrl={article.coverImageUrl ?? undefined}
      imageAlt={article.title}
      badge={article.tags?.[0] ?? undefined}
      date={
        article.publishAt
          ? formatArticleDate(new Date(article.publishAt))
          : undefined
      }
    />
  );

  const isEmpty =
    featuredArticles.length === 0 && gridArticles.length === 0 && !isLoading;

  return (
    <div className="w-full">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-30 bg-kcvv-dark-bg/95 backdrop-blur-sm border-b border-white/10 py-3">
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

      <div className="max-w-inner-lg mx-auto px-3 lg:px-0 py-6">
        {/* Featured split: 2fr | 1fr */}
        {featuredArticles.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Main featured article — 2fr */}
            <div className="lg:col-span-2">
              {featuredArticles[0] &&
                renderCard(featuredArticles[0], "featured")}
            </div>
            {/* Right stack — 1fr, 2 stacked standard cards */}
            <div className="flex flex-col gap-4">
              {featuredArticles
                .slice(1, 3)
                .map((article) => renderCard(article, "standard"))}
            </div>
          </section>
        )}

        {/* Grid of listing cards */}
        {gridArticles.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {gridArticles.map((article) => renderCard(article, "listing"))}
          </section>
        )}

        {/* Empty state */}
        {isEmpty && (
          <p className="text-center text-gray-400 py-12">
            Geen artikelen gevonden voor deze categorie.
          </p>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-8" role="status">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-kcvv-green-bright border-t-transparent" />
            <span className="sr-only">Laden...</span>
          </div>
        )}

        {/* Intersection Observer sentinel */}
        {hasMore && !isLoading && (
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
