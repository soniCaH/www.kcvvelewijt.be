import type { ArticleVM } from "@/lib/repositories/article.repository";

export interface PaginatedArticles {
  articles: ArticleVM[];
  hasMore: boolean;
}

export function paginateResults(
  articles: ArticleVM[],
  limit: number,
): PaginatedArticles {
  const hasMore = articles.length > limit;
  return {
    articles: hasMore ? articles.slice(0, limit) : articles,
    hasMore,
  };
}
