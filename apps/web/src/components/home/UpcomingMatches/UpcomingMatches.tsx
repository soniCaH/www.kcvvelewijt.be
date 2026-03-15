/**
 * UpcomingMatches Component
 * Displays upcoming matches in a horizontal scroll slider
 * Uses native CSS scroll-snap for smooth, touch-friendly scrolling
 * Matching Gatsby frontpage__matches_slider section
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { formatMatchDate } from "@/lib/utils/dates";
import type { UpcomingMatch } from "@/components/match/types";

export type { UpcomingMatch };

export interface UpcomingMatchesProps {
  /**
   * Array of upcoming matches
   */
  matches: UpcomingMatch[];
  /**
   * Section title (default: "Volgende wedstrijden")
   */
  title?: string;
  /**
   * Show "View All" link (default: true)
   */
  showViewAll?: boolean;
  /**
   * View all link href (default: "/matches")
   */
  viewAllHref?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Upcoming matches horizontal slider for homepage
 *
 * Visual specifications (matching Gatsby):
 * - Horizontal scrollable container with CSS scroll-snap
 * - Match cards displayed side-by-side
 * - Navigation arrows for desktop
 * - Touch-friendly swipe on mobile
 * - Responsive: single card on mobile, multiple on desktop
 *
 * @example
 * ```tsx
 * <UpcomingMatches
 *   matches={matches}
 *   title="Volgende wedstrijden"
 *   showViewAll={true}
 * />
 * ```
 */
export const UpcomingMatches = ({
  matches,
  title = "Volgende wedstrijden",
  showViewAll = true,
  viewAllHref = "/matches",
  className,
}: UpcomingMatchesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to show/hide navigation arrows
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1,
    );
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, []);

  // Recalculate scroll position when matches change (after DOM updates)
  useEffect(() => {
    const timeoutId = setTimeout(checkScrollPosition, 0);
    return () => clearTimeout(timeoutId);
  }, [matches]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  if (matches.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "frontpage__matches_slider w-full py-4 lg:py-6 bg-gray-50",
        className,
      )}
    >
      <div className="max-w-inner-lg mx-auto px-3 lg:px-0">
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

        {/* Slider Container */}
        <div className="relative py-2">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              aria-label="Scroll left"
            >
              <svg
                className="w-6 h-6 text-kcvv-green-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Scrollable Matches */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide py-8"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
              aria-label="Scroll right"
            >
              <svg
                className="w-6 h-6 text-kcvv-green-dark"
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
            </button>
          )}
        </div>
      </div>

      {/* Add CSS for hiding scrollbar in webkit browsers */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

/**
 * Individual Match Card Component
 */
const MatchCard = ({ match }: { match: UpcomingMatch }) => {
  const isFinished = match.status === "finished";
  const isForfeited = match.status === "forfeited";
  const isPostponed = match.status === "postponed";
  const isStopped = match.status === "stopped";

  return (
    <div className="snap-start shrink-0 w-[280px] lg:w-[320px]">
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 h-full border border-gray-100">
        {/* Competition & Round */}
        {match.competition && (
          <div className="mb-5 flex items-center gap-2 text-xs flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-kcvv-green-bright/10 text-kcvv-green-dark font-semibold whitespace-nowrap">
              {match.competition}
            </span>
            {match.round && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold whitespace-nowrap">
                {match.round}
              </span>
            )}
          </div>
        )}

        {/* Teams */}
        <div
          className={cn(
            "mb-5",
            isFinished || isForfeited ? "space-y-3" : "space-y-4",
          )}
        >
          {/* Home Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {match.homeTeam.logo && (
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <Image
                    src={match.homeTeam.logo}
                    alt={`${match.homeTeam.name} logo`}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
              )}
              <span className="font-semibold text-gray-900 text-sm leading-tight truncate">
                {match.homeTeam.name}
              </span>
            </div>
            {(isFinished || isForfeited) &&
              match.homeTeam.score !== undefined && (
                <span className="text-3xl font-bold text-kcvv-green-dark flex-shrink-0">
                  {match.homeTeam.score}
                </span>
              )}
          </div>

          {/* VS Divider - only show when there are scores */}
          {(isFinished || isForfeited) && (
            <div className="flex items-center justify-center -my-1">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>
          )}

          {/* Away Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {match.awayTeam.logo && (
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  <Image
                    src={match.awayTeam.logo}
                    alt={`${match.awayTeam.name} logo`}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
              )}
              <span className="font-semibold text-gray-900 text-sm leading-tight truncate">
                {match.awayTeam.name}
              </span>
            </div>
            {(isFinished || isForfeited) &&
              match.awayTeam.score !== undefined && (
                <span className="text-3xl font-bold text-kcvv-green-dark flex-shrink-0">
                  {match.awayTeam.score}
                </span>
              )}
          </div>
        </div>

        {/* Match Info */}
        <div className="pt-4 border-t border-gray-100">
          {isPostponed && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-orange-50 border border-orange-200">
              <span className="text-orange-700 font-semibold text-xs uppercase tracking-wide">
                Uitgesteld
              </span>
            </div>
          )}
          {isStopped && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-orange-50 border border-orange-200">
              <span className="text-orange-700 font-semibold text-xs uppercase tracking-wide">
                Gestopt
              </span>
            </div>
          )}
          {isForfeited && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200">
              <span className="text-gray-700 font-semibold text-xs uppercase tracking-wide">
                FF
              </span>
            </div>
          )}
          {!isPostponed && !isStopped && !isForfeited && (
            <div className="text-sm text-gray-600 space-y-0.5">
              <div className="font-semibold text-gray-900">
                {formatMatchDate(match.date)}
              </div>
              {match.time && <div className="text-gray-500">{match.time}</div>}
              {match.venue && (
                <div className="text-gray-500">{match.venue}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
