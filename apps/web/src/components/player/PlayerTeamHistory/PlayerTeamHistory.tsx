/**
 * PlayerTeamHistory Component
 *
 * Displays a timeline of a player's team affiliations at the club.
 * Shows chronological progression from youth teams to senior squads.
 *
 * Features:
 * - Vertical timeline with team entries
 * - Current team highlighted with green indicator
 * - Date ranges formatted in Dutch
 * - Responsive design
 * - Loading skeleton state
 * - Empty state handling
 */

import { forwardRef, type HTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface TeamHistoryEntry {
  /** Team name */
  teamName: string;
  /** Team URL slug */
  teamSlug: string;
  /** Start date (YYYY-MM-DD format) */
  startDate: string;
  /** End date (YYYY-MM-DD format), undefined if still at team */
  endDate?: string;
  /** Whether this is the current team */
  isCurrent: boolean;
}

export interface PlayerTeamHistoryProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of team history entries, ordered from most recent to oldest */
  entries: TeamHistoryEntry[];
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Format a date string to Dutch locale
 * Parses YYYY-MM-DD manually to avoid timezone-induced off-by-one errors
 */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  // Create date using local timezone (month is 0-indexed)
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "short",
  });
}

/**
 * Format a date range for display
 */
function formatDateRange(startDate: string, endDate?: string): string {
  const start = formatDate(startDate);
  if (!endDate) {
    return `${start} - heden`;
  }
  const end = formatDate(endDate);
  return `${start} - ${end}`;
}

export const PlayerTeamHistory = forwardRef<
  HTMLDivElement,
  PlayerTeamHistoryProps
>(({ entries, isLoading = false, className, ...props }, ref) => {
  // Loading skeleton
  if (isLoading) {
    return (
      <div
        ref={ref}
        className={cn("animate-pulse", className)}
        aria-label="Teamgeschiedenis laden..."
        {...props}
      >
        <h3 className="text-kcvv-gray-dark mb-4 text-lg font-semibold">
          Teamgeschiedenis
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="mt-1.5 h-3 w-3 rounded-full bg-gray-300" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 rounded bg-gray-300" />
                <div className="h-4 w-24 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        <h3 className="text-kcvv-gray-dark mb-4 text-lg font-semibold">
          Teamgeschiedenis
        </h3>
        <p className="text-kcvv-gray text-sm">
          Geen teamgeschiedenis beschikbaar.
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn(className)} {...props}>
      <h3 className="text-kcvv-gray-dark mb-4 text-lg font-semibold">
        Teamgeschiedenis
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute top-2 bottom-2 left-1.5 w-0.5 bg-gray-200"
          aria-hidden="true"
        />

        {/* Timeline entries */}
        <ul className="space-y-4" role="list">
          {entries.map((entry, index) => (
            <li
              key={`${entry.teamSlug}-${entry.startDate}`}
              className="relative flex gap-4"
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  "relative z-10 mt-1.5 h-3 w-3 rounded-full ring-2 ring-white",
                  entry.isCurrent ? "bg-kcvv-green-bright" : "bg-gray-400",
                )}
                aria-hidden="true"
              />

              {/* Entry content */}
              <div className="flex-1 pb-2">
                <Link
                  href={`/ploegen/${entry.teamSlug}`}
                  className={cn(
                    "hover:text-kcvv-green-bright font-medium transition-colors",
                    entry.isCurrent
                      ? "text-kcvv-green-bright"
                      : "text-kcvv-gray-dark",
                  )}
                >
                  {entry.teamName}
                </Link>
                <p className="text-kcvv-gray text-sm">
                  {formatDateRange(entry.startDate, entry.endDate)}
                </p>
                {entry.isCurrent && index === 0 && (
                  <span className="bg-kcvv-green-bright mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium text-white">
                    Huidig team
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

PlayerTeamHistory.displayName = "PlayerTeamHistory";
