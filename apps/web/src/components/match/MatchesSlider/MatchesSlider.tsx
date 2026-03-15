/**
 * MatchesSlider Component
 *
 * Horizontally scrollable row of compact match teasers with prev/next arrows.
 * Useful for homepage sections and sidebar widgets.
 */

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { MatchTeaser } from "../MatchTeaser/MatchTeaser";
import type { UpcomingMatch } from "@/components/match/types";

export interface MatchesSliderProps {
  /** Matches to display */
  matches: UpcomingMatch[];
  /** Team ID to highlight */
  highlightTeamId?: number;
  /** Section heading */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

function mapStatus(
  status: UpcomingMatch["status"],
): "upcoming" | "finished" | "forfeited" | "postponed" | "stopped" {
  return status === "scheduled" ? "upcoming" : status;
}

export const MatchesSlider = ({
  matches,
  highlightTeamId,
  title,
  className,
}: MatchesSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    const id = setTimeout(checkScroll, 0);
    return () => clearTimeout(id);
  }, [matches, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  if (matches.length === 0) return null;

  return (
    <div className={cn("", className)}>
      {title && (
        <h3 className="text-lg font-bold text-[#31404b] mb-3">{title}</h3>
      )}

      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Scroll naar links"
          >
            <svg
              className="w-5 h-5 text-kcvv-green-dark"
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

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-3 min-w-max">
            {matches.map((match) => (
              <div key={match.id} className="w-72 shrink-0">
                <MatchTeaser
                  homeTeam={{
                    id: match.homeTeam.id,
                    name: match.homeTeam.name,
                    logo: match.homeTeam.logo,
                  }}
                  awayTeam={{
                    id: match.awayTeam.id,
                    name: match.awayTeam.name,
                    logo: match.awayTeam.logo,
                  }}
                  date={match.date.toISOString()}
                  time={match.time}
                  score={
                    match.homeTeam.score != null && match.awayTeam.score != null
                      ? {
                          home: match.homeTeam.score,
                          away: match.awayTeam.score,
                        }
                      : undefined
                  }
                  status={mapStatus(match.status)}
                  highlightTeamId={highlightTeamId}
                  variant="compact"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Scroll naar rechts"
          >
            <svg
              className="w-5 h-5 text-kcvv-green-dark"
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
  );
};
