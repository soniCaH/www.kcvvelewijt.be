/**
 * MatchList Component
 *
 * Renders a vertical stacked list of matches using MatchTeaser.
 * Handles conversion from UpcomingMatch data shape to MatchTeaser props.
 */

import { cn } from "@/lib/utils/cn";
import { MatchTeaser } from "../MatchTeaser/MatchTeaser";
import type { UpcomingMatch } from "@/components/match/types";

export interface MatchListProps {
  /** Matches to display */
  matches: UpcomingMatch[];
  /** Team ID to highlight (e.g. KCVV's own team) */
  highlightTeamId?: number;
  /** Message shown when the list is empty */
  emptyMessage?: string;
  /** Loading skeleton state */
  isLoading?: boolean;
  /** Number of loading skeletons to show */
  loadingCount?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Map UpcomingMatch status to the subset accepted by MatchTeaser.
 * "scheduled" → "upcoming" to align with MatchTeaser's status union.
 */
function mapStatus(
  status: UpcomingMatch["status"],
): "upcoming" | "finished" | "forfeited" | "postponed" | "stopped" {
  return status === "scheduled" ? "upcoming" : status;
}

export const MatchList = ({
  matches,
  highlightTeamId,
  emptyMessage = "Geen wedstrijden gevonden.",
  isLoading = false,
  loadingCount = 3,
  className,
}: MatchListProps) => {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: loadingCount }).map((_, i) => (
          <MatchTeaser
            key={i}
            homeTeam={{ name: "" }}
            awayTeam={{ name: "" }}
            date=""
            status="upcoming"
            isLoading
          />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <p className={cn("text-sm text-gray-500 py-4", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {matches.map((match) => (
        <MatchTeaser
          key={match.id}
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
              ? { home: match.homeTeam.score, away: match.awayTeam.score }
              : undefined
          }
          status={mapStatus(match.status)}
          highlightTeamId={highlightTeamId}
        />
      ))}
    </div>
  );
};
