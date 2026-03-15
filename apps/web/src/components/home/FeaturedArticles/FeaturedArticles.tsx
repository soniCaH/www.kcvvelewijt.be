/**
 * FeaturedArticles Component
 * Hero section displaying featured articles in a carousel format
 * Matching Gatsby frontpage__featured_articles section
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Pause, Play } from "@/lib/icons";

export interface FeaturedArticle {
  /**
   * Article slug/path
   */
  href: string;
  /**
   * Article title
   */
  title: string;
  /**
   * Article excerpt/description
   */
  description?: string;
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
   * ISO 8601 date for machine-readable semantic HTML
   */
  dateIso?: string;
  /**
   * Article tags/categories
   */
  tags?: Array<{ name: string }>;
}

export interface FeaturedArticlesProps {
  /**
   * Array of featured articles (3-5 recommended)
   */
  articles: FeaturedArticle[];
  /**
   * Auto-rotate interval in milliseconds (default: 5000)
   */
  autoRotateInterval?: number;
  /**
   * Enable auto-rotate (default: true)
   */
  autoRotate?: boolean;
}

/**
 * Featured articles carousel for homepage hero section
 *
 * Visual specifications (matching Gatsby):
 * - Full-width hero section with overlay text
 * - Active article displayed prominently
 * - Side panel with article list for desktop navigation
 * - Auto-rotation with progress indicator and manual controls
 * - Responsive: stacked on mobile, side-by-side on desktop
 *
 * @example
 * ```tsx
 * <FeaturedArticles
 *   articles={articles}
 *   autoRotateInterval={5000}
 * />
 * ```
 */
export const FeaturedArticles = ({
  articles,
  autoRotateInterval = 5000,
  autoRotate = true,
}: FeaturedArticlesProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const isPaused = isHoverPaused || isFocusPaused || isUserPaused;

  // Incremented in each event handler that clears the last pause source so the
  // progress fill span remounts (resetting the CSS animation to 0) in sync with
  // the interval restarting in the auto-rotate useEffect below.
  const [resumeGen, setResumeGen] = useState(0);

  // Clamp autoRotateInterval to minimum 1000ms to prevent runaway intervals
  const safeInterval = Math.max(autoRotateInterval, 1000);

  // Clamp activeIndex if articles array shrinks - use derived state instead of effect
  const clampedIndex =
    activeIndex >= articles.length && articles.length > 0 ? 0 : activeIndex;

  // Auto-rotate through articles.
  // clampedIndex is intentionally included in the dependency array so that
  // useEffect re-runs (and clearInterval + setInterval fire) after every slide
  // change — whether triggered by setActiveIndex via auto-rotation or manual
  // navigation. This makes setInterval behave like a chained setTimeout: each
  // slide always receives a full safeInterval before setActiveIndex advances to
  // the next index, which keeps the carousel-progress-fill animation in sync.
  // An explicit setTimeout loop would be an equivalent, perhaps clearer,
  // alternative for future maintainers.
  useEffect(() => {
    if (!autoRotate || articles.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % articles.length);
    }, safeInterval);

    return () => clearInterval(timer);
  }, [autoRotate, safeInterval, articles.length, isPaused, clampedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + articles.length) % articles.length,
      );
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIndex((current) => (current + 1) % articles.length);
    }
  };

  // Handle focus events with relatedTarget checks to prevent brief unpausing during keyboard navigation.
  // Uses a separate isFocusPaused state so onMouseLeave cannot clear a keyboard-focus pause.
  const handleFocus = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsFocusPaused(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsFocusPaused(false);
      if (!isHoverPaused && !isUserPaused) setResumeGen((g) => g + 1);
    }
  };

  const handleUserPauseToggle = () => {
    const resuming = isUserPaused;
    setIsUserPaused((prev) => !prev);
    if (resuming && !isHoverPaused && !isFocusPaused)
      setResumeGen((g) => g + 1);
  };

  if (articles.length === 0) {
    return null;
  }

  const activeArticle = articles[clampedIndex];

  return (
    <section
      onMouseEnter={() => setIsHoverPaused(true)}
      onMouseLeave={() => {
        setIsHoverPaused(false);
        if (!isFocusPaused && !isUserPaused) setResumeGen((g) => g + 1);
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Uitgelichte artikelen"
      className="frontpage__featured_articles w-full bg-kcvv-black relative overflow-hidden focus-visible:outline-2 focus-visible:outline-kcvv-green-bright focus-visible:outline-offset-0"
    >
      {/* Screen reader live region — announces active article on change */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {activeArticle.title}
      </div>

      <div className="relative w-full h-[400px] lg:h-[600px]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          {activeArticle.imageUrl && (
            <Image
              src={activeArticle.imageUrl}
              alt={activeArticle.imageAlt}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          {/* Dark gradient: strong on left (where text sits), fades right toward sidebar */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20" />
        </div>

        {/* Content Overlay — padded away from sidebar on desktop */}
        <div className="relative z-10 h-full flex items-center px-4 lg:px-10">
          <Link
            href={activeArticle.href}
            className="group flex flex-col justify-center max-w-lg lg:max-w-xl"
          >
            {activeArticle.tags && activeArticle.tags[0] && (
              <span className="inline-block bg-kcvv-green-bright text-kcvv-black! text-[10px] font-bold uppercase tracking-widest px-[10px] py-[3px] rounded-sm mb-4 w-fit">
                {activeArticle.tags[0].name}
              </span>
            )}

            <h2 className="frontpage__featured_article__title font-title text-white! text-[clamp(1.75rem,5.5vw,5rem)]! font-black! leading-[1.02]! tracking-tight mb-5! group-hover:text-white/75! transition-colors">
              {activeArticle.title}
            </h2>

            {activeArticle.description && (
              <p className="frontpage__featured_article__title__description text-white/75 text-[1.1rem] leading-[1.55] mb-5 line-clamp-3">
                {activeArticle.description}
              </p>
            )}

            <div className="frontpage__featured_article__meta__wrapper flex items-center gap-4 text-[13px] text-white/60">
              <time
                className="frontpage__featured_article__meta"
                dateTime={activeArticle.dateIso}
              >
                {activeArticle.date}
              </time>
            </div>
          </Link>
        </div>

        {/* Navigation Dots + Pause Button */}
        {articles.length > 1 && (
          <div className="absolute bottom-6 left-4 lg:left-10 z-20 flex items-center gap-2">
            {/* Pause/Play toggle — WCAG 2.2.2 */}
            {autoRotate && (
              <button
                type="button"
                onClick={handleUserPauseToggle}
                className={cn(
                  "p-1 rounded-full transition-all",
                  isUserPaused
                    ? "bg-white/20 text-white"
                    : "bg-transparent text-white/40 hover:text-white/80",
                )}
                aria-label={
                  isUserPaused ? "Artikelen hervatten" : "Artikelen pauzeren"
                }
              >
                {isUserPaused ? (
                  <Play className="w-2.5 h-2.5" aria-hidden="true" />
                ) : (
                  <Pause className="w-2.5 h-2.5" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Progress dots — active dot fills with green over the interval duration */}
            <div className="flex items-center gap-1">
              {articles.map((article, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group p-1"
                  aria-label={`Artikel ${index + 1}: ${article.title}`}
                  aria-current={index === clampedIndex ? "true" : undefined}
                >
                  {/* Visual dot — overflow-hidden clips the progress fill animation */}
                  <span
                    className={cn(
                      "relative block overflow-hidden rounded-full transition-all",
                      index === clampedIndex
                        ? "w-10 h-3 bg-white/25"
                        : "w-3 h-3 bg-white/40 group-hover:bg-white/65",
                    )}
                  >
                    {/* Progress fill — animates via CSS keyframe when autoRotate is on.
                      Keyed on pauseGen so the span remounts (resetting the animation)
                      whenever the carousel resumes, keeping it in sync with the interval. */}
                    {index === clampedIndex && (
                      <span
                        key={resumeGen}
                        className={cn(
                          "absolute inset-0 rounded-full bg-kcvv-green-bright",
                          autoRotate && "carousel-progress-fill",
                        )}
                        style={
                          autoRotate
                            ? {
                                animationDuration: `${safeInterval}ms`,
                                animationPlayState: isPaused
                                  ? "paused"
                                  : "running",
                              }
                            : undefined
                        }
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Side Article Panel (Desktop only) — floating cards over the image */}
        {articles.length > 1 && (
          <div className="hidden lg:flex absolute right-4 top-0 bottom-0 w-80 flex-col justify-center gap-3 z-20">
            {articles.map((article, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "frontpage__featured_article group flex items-start gap-3 p-3 rounded-sm transition-all cursor-pointer text-left border backdrop-blur-sm",
                  index === clampedIndex
                    ? "frontpage__featured_article--active bg-kcvv-black/90 border-kcvv-green-bright"
                    : "bg-black/65 border-white/10 hover:bg-black/80 hover:border-white/25",
                )}
                aria-label={`Ga naar artikel: ${article.title}`}
                aria-current={index === clampedIndex ? "true" : undefined}
              >
                {/* Thumbnail */}
                {article.imageUrl && (
                  <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden">
                    <Image
                      src={article.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                )}

                {/* Title + date */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-white! text-xs font-semibold line-clamp-3 leading-snug group-hover:text-kcvv-green-bright! transition-colors">
                    {article.title}
                  </span>
                  <time
                    className="text-white/50 text-xs"
                    dateTime={article.dateIso}
                  >
                    {article.date}
                  </time>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
