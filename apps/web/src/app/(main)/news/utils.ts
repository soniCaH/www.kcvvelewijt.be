import type { SanityArticleListItem } from "@/lib/effect/services/SanityService";

export interface PaginatedArticles {
  articles: SanityArticleListItem[];
  hasMore: boolean;
}

export function paginateResults(
  articles: SanityArticleListItem[],
  limit: number,
): PaginatedArticles {
  const hasMore = articles.length > limit;
  return {
    articles: hasMore ? articles.slice(0, limit) : articles,
    hasMore,
  };
}
