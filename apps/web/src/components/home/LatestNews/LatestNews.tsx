/**
 * LatestNews Component
 * Displays latest news articles in a grid layout
 * Matching Gatsby frontpage__main_content section
 */

import Link from "next/link";
import { ArticleCard } from "@/components/article";
import { cn } from "@/lib/utils/cn";

export interface LatestNewsArticle {
  /**
   * Article slug/path
   */
  href: string;
  /**
   * Article title
   */
  title: string;
  /**
   * Featured image URL
   */
  imageUrl?: string;
  /**
   * Image alt text
   */
  imageAlt: string;
  /**
   * Publication date (formatted)
   */
  date: string;
  /**
   * Article tags/categories
   */
  tags?: Array<{ name: string }>;
}

export interface LatestNewsProps {
  /**
   * Array of latest news articles (6-9 recommended for grid)
   */
  articles: LatestNewsArticle[];
  /**
   * Section title (default: "Laatste nieuws")
   */
  title?: string;
  /**
   * Show "View All" link (default: true)
   */
  showViewAll?: boolean;
  /**
   * View all link href (default: "/news")
   */
  viewAllHref?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Latest news section for homepage
 *
 * Visual specifications (matching Gatsby):
 * - Section with title and "View All" link
 * - Grid layout: 3 columns on desktop, 1 column on mobile
 * - Uses ArticleCard components
 * - Green section background with padding
 *
 * @example
 * ```tsx
 * <LatestNews
 *   articles={latestArticles}
 *   title="Laatste nieuws"
 *   showViewAll={true}
 * />
 * ```
 */
export const LatestNews = ({
  articles,
  title = "Laatste nieuws",
  showViewAll = true,
  viewAllHref = "/news",
  className,
}: LatestNewsProps) => {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "frontpage__main_content page__section w-full bg-gray-100 relative overflow-hidden py-20",
        className,
      )}
    >
      <div className="relative z-20 frontpage__main_content__wrapper max-w-inner-lg mx-auto px-3 lg:px-0">
        {/* Section Header */}
        <header className="flex items-center justify-between mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-kcvv-green-dark uppercase">
            {title}
          </h2>

          {showViewAll && (
            <Link
              href={viewAllHref}
              className="text-kcvv-green-bright hover:text-kcvv-green-dark font-semibold uppercase text-sm transition-colors flex items-center gap-2"
            >
              Bekijk alles
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          )}
        </header>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {articles.map((article) => (
            <ArticleCard
              key={article.href}
              title={article.title}
              href={article.href}
              imageUrl={article.imageUrl}
              imageAlt={article.imageAlt}
              date={article.date}
              tags={article.tags}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
