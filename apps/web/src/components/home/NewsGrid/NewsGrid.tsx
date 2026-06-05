// apps/web/src/components/home/NewsGrid/NewsGrid.tsx
import { SectionHeader } from "@/components/design-system";
import { NewsCard } from "@/components/article/NewsCard";
import type {
  NewsCardBg,
  NewsCardRotation,
} from "@/components/article/NewsCard/NewsCard";

/**
 * Article-type union surfaced by `ARTICLES_QUERY`. Kept inline rather
 * than imported from the repository layer so `<NewsGrid>` doesn't
 * couple to GROQ result types — the home barrel pattern already
 * established by `<NewsGridArticle>` / `<UitgelichtArticle>`. Future
 * `matchPreview` / `matchRecap` types (per `card-semantics-locked.md`
 * §"Open follow-ups") slot in here when they land.
 */
type ArticleType =
  | "transfer"
  | "interview"
  | "announcement"
  | "event"
  | "matchPreview"
  | "matchRecap";

export interface NewsGridArticle {
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt: string;
  date: string;
  /** Drives the per-card background via the R3.B `BG_BY_TYPE` lookup
   *  (`card-semantics-locked.md`). `null` / missing falls back to
   *  cream so legacy untyped articles render cleanly. */
  articleType?: ArticleType | null;
  tags?: Array<{ name: string }>;
}

export interface NewsGridProps {
  /**
   * 0–6 articles in chronological order. N=0 returns null; 1..5
   * render in a 3-col grid with the last row partially filled;
   * 6 fills the full 3×2; 7+ silently caps at the first 6 — overflow
   * accessible via the section header's "Alle berichten →" link.
   */
  articles: NewsGridArticle[];
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  className?: string;
}

// R3.B per-articleType background lookup. Transfer carries the
// "green = transfer" semantic (jersey-deep); every other type stays
// on the calm cream surface. Owner-accepted risk: a transfer-window
// run with 3–4 transfers in the grid will read heavy. See
// `card-semantics-locked.md` for the rationale that retired the
// previous slot-rhythm cycle.
const BG_BY_TYPE: Record<ArticleType, NewsCardBg> = {
  transfer: "jersey-deep",
  interview: "cream",
  announcement: "cream",
  event: "cream",
  // Default cream per card-semantics-locked.md ("a future round picks the colour").
  matchPreview: "cream",
  matchRecap: "cream",
};

function bgForArticle(type: NewsGridArticle["articleType"]): NewsCardBg {
  return type ? BG_BY_TYPE[type] : "cream";
}

// Six-entry rotation pool covering the full 3×2 grid. The four
// canonical pool entries cycle and the last two repeat the first two
// so the bottom-row cards don't all share rotation `a`.
const SLOT_ROTATIONS: NewsCardRotation[] = ["a", "b", "c", "d", "a", "b"];

export const NewsGrid = ({
  articles,
  title = "Laatste nieuws",
  showViewAll = true,
  viewAllHref = "/nieuws",
  className,
}: NewsGridProps) => {
  if (articles.length === 0) {
    return null;
  }

  // Cap at 6 per the R2.B geometry. Overflow flows through the
  // "Alle berichten →" link, not the grid.
  const cards = articles.slice(0, 6);

  return (
    <section className={className}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {showViewAll ? (
          <SectionHeader
            title={title}
            linkText="Alle berichten"
            linkHref={viewAllHref}
          />
        ) : (
          <SectionHeader title={title} />
        )}

        {/* 3×2 chronological grid — R2.B (`newsgrid-revisit-locked.md`).
            Replaces the previous Phase 4 Round 5b 1+4 asymmetric layout:
            Uitgelicht (R1.6) now owns the editorial-lead role, so the
            news grid drops internal hierarchy and reads as a flat
            six-card chronological stream. Mobile collapses to one
            column; ≥ 640px stays at three. */}
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-3 sm:gap-6">
          {cards.map((article, idx) => (
            <li key={article.href} className="h-full">
              <NewsCard
                variant="standard"
                title={article.title}
                href={article.href}
                imageUrl={article.imageUrl}
                imageAlt={article.imageAlt}
                badge={article.tags?.[0]?.name}
                date={article.date}
                aspectRatio="landscape-16-9"
                rotation={SLOT_ROTATIONS[idx]}
                bg={bgForArticle(article.articleType)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
