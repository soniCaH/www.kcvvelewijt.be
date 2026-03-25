/**
 * News Listing Page
 * Featured split at top (2fr|1fr), 3-column grid below with infinite scroll,
 * sticky category filter bar.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import type { Metadata } from "next";
import { NewsListingClient } from "./NewsListingClient";
import { fetchArticlesAction } from "./actions";
import { INITIAL_TOTAL } from "./constants";

interface NewsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({
  searchParams,
}: NewsPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  if (!category) {
    return {
      title: "Nieuwsarchief | KCVV Elewijt",
      description:
        "Bekijk al het nieuws van KCVV Elewijt. Filter op categorie of zoek naar specifieke artikelen.",
    };
  }
  return {
    title: `${category} - Nieuwsarchief | KCVV Elewijt`,
    description: `Bekijk al het ${category} nieuws van KCVV Elewijt.`,
  };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;

  // Fetch unique tags (lightweight) and initial paginated batch in parallel
  const [allTags, initialBatch] = await Promise.all([
    runPromise(
      Effect.gen(function* () {
        const repo = yield* ArticleRepository;
        const tags = yield* repo.findTags();
        return tags.filter((t): t is string => t != null);
      }).pipe(Effect.catchAll(() => Effect.succeed([] as string[]))),
    ),
    fetchArticlesAction({
      offset: 0,
      limit: INITIAL_TOTAL,
      category: categorySlug,
    }).catch((error) => {
      console.error("[NewsPage] Failed to fetch initial articles:", error);
      return { articles: [], hasMore: false } as const;
    }),
  ]);

  const categories = [...allTags].sort().map((tag) => ({
    id: tag,
    attributes: { name: tag, slug: tag },
  }));

  // Split initial batch: 3 featured + rest as grid
  const featuredArticles = initialBatch.articles.slice(0, 3);
  const gridArticles = initialBatch.articles.slice(3);

  return (
    <NewsListingClient
      featuredArticles={featuredArticles}
      initialArticles={gridArticles}
      categories={categories}
      hasMore={initialBatch.hasMore}
      initialCategory={categorySlug}
      fetchArticles={fetchArticlesAction}
    />
  );
}

export const revalidate = 3600;
