import type { ArticleVM } from "@/lib/repositories/article.repository";

export interface PaginatedArticles {
  articles: ArticleVM[];
  hasMore: boolean;
}

export function deduplicateById(
  articles: ArticleVM[],
  existingIds: ReadonlySet<string>,
): ArticleVM[] {
  const seen = new Set(existingIds);
  return articles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
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
