// apps/web/src/components/home/FeaturedUitgelichtRow/FeaturedUitgelichtRow.tsx
import { EditorialHeading } from "@/components/design-system";
import { NewsCard } from "@/components/article/NewsCard";
import type { NewsCardBg } from "@/components/article/NewsCard/NewsCard";

/**
 * Article shape consumed by the row. Intentionally local (not
 * `ArticleVM` from the repository layer) — mirrors the
 * `<NewsGrid>` / `NewsGridArticle` pattern of decoupling section
 * components from Sanity GROQ result types. The page wires
 * `ARTICLES_QUERY` → this shape at the call site.
 *
 * `articleType` drives the per-card background via the R3.B
 * `BG_BY_TYPE` lookup. `dek` is exposed for future use once
 * `ARTICLES_QUERY` surfaces `lead` (not part of the projection at
 * the time of this PR — graceful-omit is honoured trivially).
 */
export interface UitgelichtArticle {
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt: string;
  date: string;
  articleType?: ArticleType | null;
  dek?: string;
  badge?: string;
}

/**
 * The subset of `articleType` values the homepage spine handles
 * today. Mirrored from `card-semantics-locked.md` R3.B; widened to
 * the literal union here so the lookup stays exhaustive.
 */
export type ArticleType =
  | "transfer"
  | "interview"
  | "announcement"
  | "event"
  | "matchPreview"
  | "matchRecap";

// R3.B (`card-semantics-locked.md`) — per-type background. Transfer
// articles get the jersey-deep "green = transfer" semantic; all other
// types keep the calm cream surface. The Uitgelicht-locked.md R1.6.A
// prominence delta (cream-consistent) is reconciled with R3.B by
// applying BG_BY_TYPE here too (issue #1750 owner decision).
const BG_BY_TYPE: Record<ArticleType, NewsCardBg> = {
  transfer: "jersey-deep",
  interview: "cream",
  announcement: "cream",
  event: "cream",
  matchPreview: "cream",
  matchRecap: "cream",
};

function bgForArticle(type: UitgelichtArticle["articleType"]): NewsCardBg {
  return type ? BG_BY_TYPE[type] : "cream";
}

export interface FeaturedUitgelichtRowProps {
  /**
   * 0..3 featured articles. The row drops itself entirely when
   * `articles.length === 0` (returns `null`); shorter arrays render
   * fewer cards per the R1.6.A "render fewer cards rather than pad
   * from non-featured pool" rule.
   */
  articles: readonly UitgelichtArticle[];
  className?: string;
}

export const FeaturedUitgelichtRow = ({
  articles,
  className,
}: FeaturedUitgelichtRowProps) => {
  if (articles.length === 0) {
    return null;
  }

  // Cap at 3 even if a caller passes more — the row is the editorial
  // "featured" surface, not a recent-articles fallback. Excess
  // articles flow into <NewsGrid> downstream of the homepage spine.
  const cards = articles.slice(0, 3);

  return (
    <section className={className}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <EditorialHeading
          level={2}
          size="display-md"
          tone="ink"
          emphasis={{ text: "gelicht" }}
          className="mb-8"
        >
          {/* EditorialHeading appends the trailing period; "Uitgelicht."
              renders with italic emphasis on "gelicht" + period. */}
          Uitgelicht
        </EditorialHeading>

        <div
          role="list"
          className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8"
        >
          {cards.map((article) => (
            <div key={article.href} role="listitem" className="h-full">
              <NewsCard
                variant="featured"
                title={article.title}
                href={article.href}
                imageUrl={article.imageUrl}
                imageAlt={article.imageAlt}
                badge={article.badge}
                date={article.date}
                dek={article.dek}
                aspectRatio="landscape-16-9"
                bg={bgForArticle(article.articleType)}
                // Uitgelicht's 3-up cards live in medium real estate
                // — keep the featured-size heading + lg padding, but
                // drop to a single `md` tape so the corners don't
                // dominate the photo.
                tapeCount={1}
                tapeLength="md"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
