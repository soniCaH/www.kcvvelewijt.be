/**
 * MatchesSlider Component
 *
 * Horizontally scrollable row of compact match teasers with prev/next arrows.
 * Useful for homepage sections and sidebar widgets.
 */

"use client";

import { HorizontalSlider } from "@/components/design-system/HorizontalSlider/HorizontalSlider";
import { MatchTeaser } from "../MatchTeaser/MatchTeaser";
import type { UpcomingMatch } from "@/components/match/types";

export interface MatchesSliderProps {
  /** Matches to display */
  matches: UpcomingMatch[];
  /** Team ID to highlight */
  highlightTeamId?: number;
  /** Section heading */
  title?: string;
  /** Theme variant — "dark" for kcvv-black sections */
  theme?: "light" | "dark";
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
  theme,
  className,
}: MatchesSliderProps) => {
  if (matches.length === 0) return null;

  return (
    <HorizontalSlider title={title} theme={theme} className={className}>
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
            venue={
              match.venue ??
              (highlightTeamId !== undefined
                ? match.homeTeam.id === highlightTeamId
                  ? "Thuis"
                  : match.awayTeam.id === highlightTeamId
                    ? "Uit"
                    : undefined
                : undefined)
            }
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
            teamLabel={match.teamLabel}
            theme={theme}
            variant="compact"
          />
        </div>
      ))}
    </HorizontalSlider>
  );
};
