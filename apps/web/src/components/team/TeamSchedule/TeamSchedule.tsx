/**
 * TeamSchedule Component
 *
 * Team match schedule for dark sections. Rows with result badges,
 * next match highlighting, and hover effects.
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
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[140px_1fr_auto_1fr_80px] items-center gap-4 px-5 py-3.5 bg-white/[0.03] rounded-sm"
          >
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-white/10 rounded-full animate-pulse" />
              <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
            <div className="flex items-center gap-2 justify-end">
              <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-6 bg-white/10 rounded-full animate-pulse" />
            </div>
            <div className="h-5 w-10 bg-white/10 rounded animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  const TERMINAL_STATUSES: MatchStatus[] = ["finished", "forfeited", "stopped"];

  let filteredMatches = showPast
    ? matches
    : matches.filter((m) => !TERMINAL_STATUSES.includes(m.status));

  filteredMatches = [...filteredMatches].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  if (limit) {
    filteredMatches = filteredMatches.slice(0, limit);
  }

  const now = new Date();
  const nextMatchIndex = highlightNext
    ? filteredMatches.findIndex((m) => m.date > now && m.status === "scheduled")
    : -1;

  if (filteredMatches.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-8 text-white/40 bg-white/[0.03] rounded-sm",
          className,
        )}
      >
        <p>Geen wedstrijden gepland.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
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
