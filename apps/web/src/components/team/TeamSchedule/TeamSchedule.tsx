/**
 * TeamSchedule Component
 *
 * Team match schedule with upcoming and past matches.
 *
 * Features:
 * - Upcoming matches highlighted
 * - Past results with scores
 * - Next match emphasized
 * - Competition type labels
 * - Home/Away indicators
 * - Responsive design
 */

import { cn } from "@/lib/utils/cn";
import { MatchResultRow } from "../../match/MatchResultRow";
import type { MatchStatus, ScheduleMatch } from "../../match/types";

export type { ScheduleMatch, ScheduleTeam } from "../../match/types";

export interface TeamScheduleProps {
  /** Array of matches */
  matches: ScheduleMatch[];
  /** Team ID for home/away display and result highlighting (optional) */
  teamId?: number;
  /** Team slug for back-navigation context on match detail page */
  teamSlug?: string;
  /** Show past results */
  showPast?: boolean;
  /** Highlight next match */
  highlightNext?: boolean;
  /** Limit number of matches shown */
  limit?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TeamSchedule({
  matches,
  teamId,
  teamSlug,
  showPast = true,
  highlightNext = true,
  limit,
  isLoading = false,
  className,
}: TeamScheduleProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const TERMINAL_STATUSES: MatchStatus[] = ["finished", "forfeited", "stopped"];

  // Filter matches based on showPast
  let filteredMatches = showPast
    ? matches
    : matches.filter((m) => !TERMINAL_STATUSES.includes(m.status));

  // Sort by date
  filteredMatches = [...filteredMatches].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Apply limit if specified
  if (limit) {
    filteredMatches = filteredMatches.slice(0, limit);
  }

  // Find next match for highlighting
  const now = new Date();
  const nextMatchIndex = highlightNext
    ? filteredMatches.findIndex((m) => m.date > now && m.status === "scheduled")
    : -1;

  // Empty state
  if (filteredMatches.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-8 text-gray-500 bg-gray-50 rounded-lg",
          className,
        )}
      >
        <p>Geen wedstrijden gepland.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {filteredMatches.map((match, index) => {
        const matchHref = teamSlug
          ? `/wedstrijd/${match.id}?from=/ploegen/${encodeURIComponent(teamSlug)}&fromTab=wedstrijden`
          : `/wedstrijd/${match.id}`;

        return (
          <MatchResultRow
            key={match.id}
            match={match}
            teamId={teamId}
            isNext={index === nextMatchIndex}
            href={matchHref}
          />
        );
      })}
    </div>
  );
}
