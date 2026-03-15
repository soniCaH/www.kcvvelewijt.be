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

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { MatchStatus } from "@/lib/effect/schemas/match.schema";

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
 * Format date in Dutch locale
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("nl-BE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Get status badge for match
 */
function StatusBadge({ status }: { status: ScheduleMatch["status"] }) {
  if (status === "postponed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
        Uitgesteld
      </span>
    );
  }
  if (status === "stopped") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
        Gestopt
      </span>
    );
  }
  if (status === "forfeited") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
        FF
      </span>
    );
  }
  return null;
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
        const isHome = teamId !== undefined && match.homeTeam.id === teamId;
        const isNext = index === nextMatchIndex;
        // Show scores if they exist, regardless of status
        // (Footbalisto API sometimes returns status=0 for matches with scores)
        const hasScore =
          typeof match.homeScore === "number" &&
          typeof match.awayScore === "number";

        // Determine result for KCVV — only when we know which side is ours
        let resultClass = "";
        if (hasScore && teamId !== undefined) {
          const kcvvScore = isHome ? match.homeScore! : match.awayScore!;
          const oppScore = isHome ? match.awayScore! : match.homeScore!;
          if (kcvvScore > oppScore) {
            resultClass = "border-l-4 border-l-green-500";
          } else if (kcvvScore < oppScore) {
            resultClass = "border-l-4 border-l-red-500";
          } else {
            resultClass = "border-l-4 border-l-yellow-500";
          }
        }

        const matchHref = teamSlug
          ? `/game/${match.id}?from=/team/${encodeURIComponent(teamSlug)}&fromTab=matches`
          : `/game/${match.id}`;

        return (
          <Link
            key={match.id}
            href={matchHref}
            className={cn(
              "block bg-white border rounded-lg p-4 transition-shadow hover:shadow-md",
              isNext
                ? "border-kcvv-green-bright ring-2 ring-kcvv-green-bright/20"
                : "border-gray-200",
              resultClass,
            )}
          >
            {/* Header row: date, time, competition */}
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {formatDate(match.date)}
                </span>
                {match.time && (
                  <span className="text-gray-500">{match.time}</span>
                )}
                <StatusBadge status={match.status} />
                {isNext && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-kcvv-green-bright text-white">
                    Volgende
                  </span>
                )}
              </div>
              {match.competition && (
                <span className="text-gray-500 text-xs hidden sm:block">
                  {match.competition}
                </span>
              )}
            </div>

            {/* Match row: teams and score */}
            <div className="flex items-center justify-between">
              {/* Home team */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {match.homeTeam.logo ? (
                  <Image
                    src={match.homeTeam.logo}
                    alt={`${match.homeTeam.name} logo`}
                    width={32}
                    height={32}
                    className="object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {match.homeTeam.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span
                  className={cn(
                    "truncate text-sm",
                    teamId !== undefined && match.homeTeam.id === teamId
                      ? "font-semibold"
                      : "text-gray-700",
                  )}
                >
                  {match.homeTeam.name}
                </span>
              </div>

              {/* Score or VS */}
              <div className="flex-shrink-0 px-4">
                {hasScore ? (
                  <div className="flex items-center gap-2 font-mono font-bold text-lg">
                    <span
                      className={cn(
                        teamId !== undefined &&
                          match.homeTeam.id === teamId &&
                          match.homeScore! > match.awayScore! &&
                          "text-kcvv-green-bright",
                      )}
                    >
                      {match.homeScore}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span
                      className={cn(
                        teamId !== undefined &&
                          match.awayTeam.id === teamId &&
                          match.awayScore! > match.homeScore! &&
                          "text-kcvv-green-bright",
                      )}
                    >
                      {match.awayScore}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 font-medium">VS</span>
                )}
              </div>

              {/* Away team */}
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span
                  className={cn(
                    "truncate text-sm text-right",
                    teamId !== undefined && match.awayTeam.id === teamId
                      ? "font-semibold"
                      : "text-gray-700",
                  )}
                >
                  {match.awayTeam.name}
                </span>
                {match.awayTeam.logo ? (
                  <Image
                    src={match.awayTeam.logo}
                    alt={`${match.awayTeam.name} logo`}
                    width={32}
                    height={32}
                    className="object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {match.awayTeam.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Home/Away indicator for mobile */}
            <div className="mt-2 text-xs text-gray-500 sm:hidden">
              {teamId !== undefined && `${isHome ? "Thuis" : "Uit"} • `}
              {match.competition || "Competitie"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
