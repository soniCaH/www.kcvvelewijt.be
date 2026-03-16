// apps/web/src/components/home/LatestNews/LatestNews.tsx
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { NewsCard } from "./NewsCard";

export interface LatestNewsArticle {
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
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  badge?: string;
  date?: string;
}

export interface LatestNewsProps {
  /** 2–3 articles; first becomes featured when no featuredEvent */
  articles: LatestNewsArticle[];
  /** When provided, fills the featured slot instead of articles[0]. #802 */
  featuredEvent?: FeaturedEventStub;
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  className?: string;
}

export const LatestNews = ({
  articles,
  featuredEvent,
  title = "Laatste nieuws",
  showViewAll = true,
  viewAllHref = "/news",
  className,
}: LatestNewsProps) => {
  if (articles.length === 0 && !featuredEvent) {
    return null;
  }

  // When an event fills the featured slot, articles[0] and [1] are standard.
  // Otherwise articles[0] is featured, articles[1] and [2] are standard.
  const standardArticles = featuredEvent
    ? articles.slice(0, 2)
    : articles.slice(1, 3);

  return (
    <section className={cn("bg-gray-100 py-20", className)}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        {/* Section header */}
        <header className="flex items-end justify-between mb-10">
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-black uppercase tracking-tight leading-none pl-4 border-l-4 border-kcvv-green-bright text-kcvv-black">
            {title}
          </h2>

          {showViewAll && (
            <Link
              href={viewAllHref}
              className="text-xs font-bold uppercase tracking-[0.1em] text-kcvv-green-dark inline-flex items-center gap-2 group"
            >
              Alle berichten
              <span
                className="inline-block transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          )}
        </header>

        {/* 1 featured + 2 standard grid */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
          {/* Featured slot — event (if provided) or first article */}
          {featuredEvent ? (
            <NewsCard
              variant="featured"
              title={featuredEvent.title}
              href={featuredEvent.href}
              imageUrl={featuredEvent.imageUrl}
              imageAlt={featuredEvent.imageAlt}
              badge={featuredEvent.badge}
              date={featuredEvent.date}
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

          {/* Standard slots — right column */}
          {standardArticles.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
