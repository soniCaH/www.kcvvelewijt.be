import type { SanityArticle } from "@/lib/effect/services/SanityService";

export interface PaginatedArticles {
  articles: SanityArticle[];
  hasMore: boolean;
}

export function paginateResults(
  articles: SanityArticle[],
  limit: number,
): PaginatedArticles {
  const hasMore = articles.length > limit;
  return {
    articles: hasMore ? articles.slice(0, limit) : articles,
    hasMore,
  };
}
