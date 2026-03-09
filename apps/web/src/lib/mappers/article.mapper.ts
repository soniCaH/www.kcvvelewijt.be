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
 * Convert a SanityArticle into a HomepageArticle suitable for homepage display.
 *
 * When `includeDescription` is true the resulting object contains a `description` property
 * with value `undefined` (intentionally present); otherwise the `description` property is omitted.
 *
 * @param article - The Sanity article to convert
 * @param includeDescription - If true, include the `description` property (set to `undefined`) in the result
 * @returns A HomepageArticle with:
 *  - `href` built from the article slug,
 *  - `title` from the article title,
 *  - optional `description` as described above,
 *  - `imageUrl` from `coverImageUrl` or omitted,
 *  - `imageAlt` from the article title,
 *  - `date` as a formatted publish date or empty string,
 *  - `dateIso` as the publish ISO string or empty string,
 *  - `tags` as an array of `{ name }` objects derived from the article's tags
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
 * Map an array of SanityArticle objects to HomepageArticle entries for the homepage.
 *
 * @param includeDescription - When true, include each article's description in the resulting HomepageArticle; when false, omit the description property.
 * @returns An array of HomepageArticle objects corresponding to the input articles
 */
export function mapSanityArticlesToHomepageArticles(
  articles: readonly SanityArticle[],
  includeDescription = false,
): HomepageArticle[] {
  return articles.map((article) =>
    mapSanityArticleToHomepageArticle(article, includeDescription),
  );
}
