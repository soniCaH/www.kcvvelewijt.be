// apps/web/src/components/home/FeaturedUitgelichtRow/FeaturedUitgelichtRow.tsx
import { EditorialHeading } from "@/components/design-system";
import { NewsCard } from "@/components/article/NewsCard";
import {
  articleTypeCardLabel,
  type ArticleType,
} from "@/lib/utils/article-type-label";
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
  /** Sanity `metadata.lqip` for `<NewsCard>`'s blur placeholder (#2401 item 3). */
  imageLqip?: string | null;
  date: string;
  articleType?: ArticleType | null;
  dek?: string;
  badge?: string;
}

/**
 * The `articleType` values the homepage spine handles, re-exported so the two
 * barrels above this file (`FeaturedUitgelichtRow/index.ts`, `home/index.ts`)
 * and `app/(landing)/page.tsx`'s exhaustive `toUitgelichtArticleType` guard
 * keep their import path.
 *
 * It is the canonical union now, not a local mirror: `BG_BY_TYPE` below and
 * `articleTypeCardLabel` are two halves of one per-type decision, and while the
 * union was spelled once here and once in `<NewsGrid>` they could disagree
 * about which types exist — which is how a type got a background with no word
 * to explain it (#2404).
 */
export type { ArticleType } from "@/lib/utils/article-type-label";

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

/**
 * Row + card classes for the Uitgelicht three-up, exported as a pair and shared
 * with the homepage route skeleton so the two can't drift — the same contract
 * `FIRST_TEAMS_ROW_GRID` and `SPONSOR_TILE_GRID_CLASS` keep for their sections.
 * (The skeleton had already drifted to a bare `gap-6` before #2405 exported
 * these, so its cards rendered wider than the real ones at `md`.)
 *
 * Flex, not grid, so a short row centres instead of leaving holes on the right
 * (#2405). The `4rem` in the basis is `md:gap-8` × the 2 gaps a three-up has,
 * so `calc((100% - 4rem) / 3)` is exactly the width a `grid-cols-3` column
 * resolves to — the card is count-independent, and three articles render
 * identically to the grid this replaced. The two constants therefore move
 * together with each other and with the `slice(0, 3)` cap below.
 */
export const UITGELICHT_ROW_CLASS =
  "flex list-none flex-wrap justify-center gap-6 p-0 md:gap-8";
export const UITGELICHT_CARD_CLASS =
  "basis-full md:basis-[calc((100%-4rem)/3)]";

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
      <div className="mx-auto max-w-[var(--container-index)] px-4 md:px-8">
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

        <ul className={UITGELICHT_ROW_CLASS}>
          {cards.map((article) => (
            <li key={article.href} className={UITGELICHT_CARD_CLASS}>
              <NewsCard
                variant="featured"
                title={article.title}
                href={article.href}
                imageUrl={article.imageUrl}
                imageLqip={article.imageLqip}
                badge={article.badge}
                // Same reason as `<NewsGrid>`'s (#2404): this row applies the
                // same `BG_BY_TYPE`, so an unlabelled green card here would sit
                // directly above a labelled one in the grid below.
                typeLabel={articleTypeCardLabel(article.articleType)}
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
