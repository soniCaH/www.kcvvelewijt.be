/**
 * MatchDetailView Component
 *
 * Composite component for match detail pages.
 * Combines MatchHeader with match content sections.
 *
 * Features:
 * - Match header with teams, score, and status
 * - Lineup section for both teams
 * - Loading state support
 * - Responsive layout
 */

import Link from "next/link";
import { MatchHeader, type MatchTeamProps } from "../MatchHeader";
import { MatchLineup, type LineupPlayer } from "../MatchLineup";
import { MatchEvents, type MatchEvent } from "../MatchEvents/MatchEvents";

export interface MatchDetailViewProps {
  /** Home team info */
  homeTeam: MatchTeamProps;
  /** Away team info */
  awayTeam: MatchTeamProps;
  /** Match date */
  date: Date;
  /** Match time (HH:MM format) */
  time?: string;
  /** Match status */
  status: "scheduled" | "finished" | "forfeited" | "postponed" | "stopped";
  /** Competition name */
  competition?: string;
  /** Home team lineup */
  homeLineup: LineupPlayer[];
  /** Away team lineup */
  awayLineup: LineupPlayer[];
  /** Whether match report is available */
  hasReport?: boolean;
  /** URL to navigate back to (e.g. team page with tab) */
  backUrl?: string;
  /** Match events (goals, cards, substitutions) */
  events?: MatchEvent[];
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a detailed match view including the header and lineup sections.
 *
 * When `isLoading` is true, renders a skeleton placeholder layout. Otherwise renders the MatchHeader and, if lineup data exists, the MatchLineup; if no lineup data is available, shows a centered message indicating no lineup.
 *
 * @returns The React element for the match detail view.
 */
export function MatchDetailView({
  homeTeam,
  awayTeam,
  date,
  time,
  status,
  competition,
  homeLineup,
  awayLineup,
  hasReport = false,
  backUrl,
  events,
  isLoading = false,
  className,
}: MatchDetailViewProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <MatchHeader
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          date={date}
          time={time}
          status={status}
          competition={competition}
          isLoading
        />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded animate-pulse" />
              <div className="h-96 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Match Header */}
      <MatchHeader
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        date={date}
        time={time}
        status={status}
        competition={competition}
      />

      {/* Match Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {backUrl && (
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-main transition-colors"
          >
            <span aria-hidden="true">←</span> Terug naar wedstrijden
          </Link>
        )}
        {/* Match Report Indicator - see issue #575 for link implementation */}
        {hasReport && status === "finished" && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-kcvv-green-bright/10 text-kcvv-green-dark rounded-full text-sm font-medium">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Wedstrijdverslag beschikbaar
            </span>
          </div>
        )}

        {/* Lineup Section - MatchLineup handles empty state internally */}
        <MatchLineup
          homeTeamName={homeTeam.name}
          awayTeamName={awayTeam.name}
          homeLineup={homeLineup}
          awayLineup={awayLineup}
        />

        {/* Events Section */}
        {events !== undefined && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Wedstrijdgebeurtenissen
            </h2>
            <MatchEvents
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
              events={events}
            />
          </div>
        )}
      </div>
    </div>
  );
}
