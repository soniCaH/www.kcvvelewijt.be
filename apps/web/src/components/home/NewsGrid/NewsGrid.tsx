// apps/web/src/components/home/NewsGrid/NewsGrid.tsx
import { SectionHeader } from "@/components/design-system";
import { NewsCard } from "@/components/article/NewsCard";
import type { NewsCardRotation } from "@/components/article/NewsCard/NewsCard";

export interface NewsGridArticle {
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt: string;
  date: string;
  tags?: Array<{ name: string }>;
}

export interface NewsGridProps {
  /** 0–5 articles. N=0 returns null. Slot 0 is the lead, slots 1..4 the cluster. */
  articles: NewsGridArticle[];
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  className?: string;
}

// Slot-index rotation cycle per Round 5d T.1. Matches the
// <TapedCardGrid> ROTATION_POOL ordering. Slot 0 is the lead.
const SLOT_ROTATIONS: NewsCardRotation[] = ["a", "b", "c", "d", "a"];

const renderCard = (
  article: NewsGridArticle,
  slot: number,
  variant: "featured" | "standard",
) => (
  <NewsCard
    key={article.href}
    variant={variant}
    title={article.title}
    href={article.href}
    imageUrl={article.imageUrl}
    imageAlt={article.imageAlt}
    badge={article.tags?.[0]?.name}
    date={article.date}
    aspectRatio="landscape-16-9"
    rotation={SLOT_ROTATIONS[slot]}
  />
);

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

  const lead = articles[0]!;
  const supporting = articles.slice(1, 5);
  const leadSpansTwoRows = supporting.length >= 2;

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

        {/*
          Geometry — Round 5b D.1 (50/50) + Round 5f E.1 (graceful collapse).
          Mobile: 1-col stack (1 lead + 2-col supporting cluster below).
          Desktop: 2-col, lead in left col spanning 2 rows when N>=3.
        */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={leadSpansTwoRows ? "md:row-span-2" : undefined}>
            {renderCard(lead, 0, "featured")}
          </div>

          {supporting.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-rows-2">
              {supporting.map((article, idx) =>
                renderCard(article, idx + 1, "standard"),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
