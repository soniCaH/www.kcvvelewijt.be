/**
 * `ArticleVM` → `<EditorialHero placement="homepage">` props. Lives beside the
 * hero rather than in the landing page so it can be unit-tested without
 * pulling the page graph in (see `to-featured-event.ts` for the same split on
 * the event side).
 *
 * Mirrors the per-variant tail the retired `toHeroCarouselArticle` built for
 * `<HomepageHeroCarousel>`: each `articleType` contributes the structured data
 * the variant renderers need (subjects, transfer fact, event fact, category).
 * The discriminated union narrowing surfaces a missing branch at compile time
 * when a new `articleType` lands (e.g. matchPreview / matchRecap from #1470).
 */
import { formatArticleDate } from "@/lib/utils/dates";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import type { EditorialHeroProps } from "./EditorialHero";

/**
 * Drop GROQ-nullable fields (`field: string | null`) so the resulting
 * shape matches the non-null `field?: string` API the EditorialHero
 * variant types expect. Generic enough to work for both transfer and
 * event projections.
 */
function nullsToUndefined<T extends object>(
  src: T | null | undefined,
): { [K in keyof T]?: NonNullable<T[K]> } | undefined {
  if (src == null) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (value !== null) out[key] = value;
  }
  return out as { [K in keyof T]?: NonNullable<T[K]> };
}

export function toEditorialHeroProps(article: ArticleVM): EditorialHeroProps {
  const shared = {
    placement: "homepage" as const,
    slug: article.slug,
    title: article.title,
    // #2393: the dek used to stop here, so the largest element on the homepage
    // was a headline plus a photograph and nothing else. `ARTICLES_QUERY`
    // coalesces `lead` to "", so normalise the sentinel back to undefined the
    // way the detail page does rather than render an empty dek slot.
    lead: article.lead?.trim() || undefined,
    coverImage: article.coverImageUrl
      ? { url: article.coverImageUrl }
      : undefined,
    date: article.publishedAt
      ? formatArticleDate(article.publishedAt)
      : undefined,
    // PERF-1 (#2235): the homepage hero cover is the LCP element — eager-load
    // it. The article detail hero (`renderArticleHero`) sets `priority` too;
    // featured and below-fold rows stay lazy.
    priority: true,
  };

  const variant = article.articleType ?? "announcement";
  switch (variant) {
    case "interview":
      return { ...shared, variant, subjects: article.subjects };
    case "event":
      return {
        ...shared,
        variant,
        feature: nullsToUndefined(article.firstEventFact),
      };
    case "transfer":
      return {
        ...shared,
        variant,
        feature: nullsToUndefined(article.firstTransferFact),
      };
    case "announcement":
      return { ...shared, variant, category: article.tags[0] };
    case "matchPreview":
    case "matchRecap":
      // Homepage hero stays kicker-only (VOORBESCHOUWING / MATCHVERSLAG) — no
      // `match` data, so no score bar. The score-forward bar only renders on
      // the detail page, which server-fetches the linked match (5.d-mat).
      return { ...shared, variant };
    default: {
      const _exhaustive: never = variant;
      throw new Error(
        `Unhandled articleType in toEditorialHeroProps: ${String(_exhaustive)}`,
      );
    }
  }
}
