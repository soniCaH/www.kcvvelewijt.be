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
import type { MatchStatus } from "@/lib/effect/schemas/match.schema";
import { MatchResultRow } from "../../match/MatchResultRow";

export interface ScheduleTeam {
  /** Team ID */
  id: number;
  /** Team name */
  name: string;
  /** Team logo URL */
  logo?: string;
}

export interface ScheduleMatch {
  /** Match ID */
  id: number;
  /** Match date */
  date: Date;
  /** Match time (HH:MM) */
  time?: string;
  /** Home team */
  homeTeam: ScheduleTeam;
  /** Away team */
  awayTeam: ScheduleTeam;
  /** Home team score (for finished matches) */
  homeScore?: number;
  /** Away team score (for finished matches) */
  awayScore?: number;
  /** Match status */
  status: MatchStatus;
  /** Competition name */
  competition?: string;
}

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

/**
 * Render the team's match schedule with optional past results, next match highlighting, and limit.
 *
 * @param matches - Array of matches to display
 * @param teamId - Current team's ID (for home/away determination)
 * @param teamSlug - Team slug used to build back-navigation URLs on the match detail page
 * @param showPast - If true, includes finished matches
 * @param highlightNext - If true, highlights the next upcoming match
 * @param limit - Optional limit on number of matches shown
 * @param isLoading - If true, renders skeleton loader
 * @param className - Optional additional CSS classes for the root element
 * @returns The rendered schedule element
 */
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
          ? `/game/${match.id}?from=/team/${encodeURIComponent(teamSlug)}&fromTab=matches`
          : `/game/${match.id}`;

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
