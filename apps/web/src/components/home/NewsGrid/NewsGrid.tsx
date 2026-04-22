// apps/web/src/components/home/NewsGrid/NewsGrid.tsx
import { SectionHeader } from "@/components/design-system";
import { NewsCard } from "@/components/article/NewsCard";

export interface NewsGridArticle {
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt: string;
  date: string;
  tags?: Array<{ name: string }>;
}

/** Stub for upcoming featured event — wired in #802 */
export interface FeaturedEventStub {
  title: string;
  href?: string;
  imageUrl?: string;
  imageAlt?: string;
  badge?: string;
  date?: string;
  time?: string;
  countdown?: string;
  isExternal?: boolean;
}

export interface NewsGridProps {
  /** 2–3 articles; first becomes featured when no featuredEvent */
  articles: NewsGridArticle[];
  /** When provided, fills the featured slot instead of articles[0]. #802 */
  featuredEvent?: FeaturedEventStub;
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  className?: string;
}

export const NewsGrid = ({
  articles,
  featuredEvent,
  title = "Laatste nieuws",
  showViewAll = true,
  viewAllHref = "/nieuws",
  className,
}: NewsGridProps) => {
  if (articles.length === 0 && !featuredEvent) {
    return null;
  }

  // When an event fills the featured slot, articles[0] and [1] are standard.
  // Otherwise articles[0] is featured, articles[1] and [2] are standard.
  const standardArticles = featuredEvent
    ? articles.slice(0, 2)
    : articles.slice(1, 3);

  return (
    <section className={className}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeader
          title={title}
          linkText={showViewAll ? "Alle berichten" : undefined}
          linkHref={showViewAll ? viewAllHref : undefined}
        />

        {/* 1 featured + 2 standard grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          {/* Featured slot — event (if provided) or first article */}
          {featuredEvent ? (
            <NewsCard
              variant="featured"
              title={featuredEvent.title}
              href={featuredEvent.href}
              imageUrl={featuredEvent.imageUrl}
              imageAlt={featuredEvent.imageAlt}
              badge={featuredEvent.badge ?? "EVENEMENT"}
              eventDate={featuredEvent.date}
              eventTime={featuredEvent.time}
              countdown={featuredEvent.countdown}
              isExternal={featuredEvent.isExternal}
            />
          ) : articles[0] ? (
            <NewsCard
              variant="featured"
              title={articles[0].title}
              href={articles[0].href}
              imageUrl={articles[0].imageUrl}
              imageAlt={articles[0].imageAlt}
              badge={articles[0].tags?.[0]?.name}
              date={articles[0].date}
            />
          ) : null}

          {/* Standard slots — right column fills featured card height on desktop */}
          {standardArticles.length > 0 && (
            <div className="flex flex-col gap-4 md:h-full">
              {standardArticles.map((article) => (
                <NewsCard
                  key={article.href}
                  variant="standard"
                  title={article.title}
                  href={article.href}
                  imageUrl={article.imageUrl}
                  imageAlt={article.imageAlt}
                  badge={article.tags?.[0]?.name}
                  date={article.date}
                  className="md:aspect-auto md:flex-1"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
