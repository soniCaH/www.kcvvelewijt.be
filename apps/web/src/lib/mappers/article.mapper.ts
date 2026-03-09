/**
 * Article Mappers
 * Transform article data between different formats
 */

import type { SanityArticle } from "@/lib/effect/services/SanityService";
import { formatArticleDate } from "@/lib/utils/dates";

export interface HomepageArticle {
  href: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imageAlt: string;
  date: string;
  dateIso: string;
  tags: Array<{ name: string }>;
}

/**
 * Map Sanity Article to Homepage Article format
 */
export function mapSanityArticleToHomepageArticle(
  article: SanityArticle,
  includeDescription = false,
): HomepageArticle {
  return {
    href: `/news/${article.slug.current}`,
    title: article.title,
    ...(includeDescription && { description: undefined }),
    imageUrl: article.coverImageUrl ?? undefined,
    imageAlt: article.title,
    date: article.publishAt ? formatArticleDate(article.publishAt) : "",
    dateIso: article.publishAt ?? "",
    tags: (article.tags ?? []).map((t) => ({ name: t })),
  };
}

/**
 * Map array of Sanity Articles to Homepage Articles
 */
export function mapSanityArticlesToHomepageArticles(
  articles: readonly SanityArticle[],
  includeDescription = false,
): HomepageArticle[] {
  return articles.map((article) =>
    mapSanityArticleToHomepageArticle(article, includeDescription),
  );
}
