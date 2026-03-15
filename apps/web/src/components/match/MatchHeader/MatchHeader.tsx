/**
 * MatchHeader Component
 *
 * Hero section for match detail pages.
 * Displays teams, score, date/time, and competition info.
 *
 * Features:
 * - Team logos and names
 * - Score display (for finished/forfeited matches)
 * - Date and time
 * - Competition badge
 * - Status indicators (Postponed, Stopped, Forfeited)
 */

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { formatMatchDate } from "@/lib/utils/dates";
import type { MatchStatus } from "@/lib/effect/schemas/match.schema";

export interface MatchTeamProps {
  /** Team name */
  name: string;
  /** Team logo URL */
  logo?: string;
  /** Team score (for finished/forfeited matches) */
  score?: number;
}

export interface MatchHeaderProps {
  /** Home team info */
  homeTeam: MatchTeamProps;
  /** Away team info */
  awayTeam: MatchTeamProps;
  /** Match date */
  date: Date;
  /** Match time (HH:MM format) */
  time?: string;
  /** Match status */
  status: MatchStatus;
  /** Competition name */
  competition?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Render a hero header for a match, showing competition, teams, score, status badges, and date/time.
 *
 * Displays a loading skeleton when `isLoading` is true. Shows scores when `status` is "finished" or
 * "forfeited", and shows localized badges for "postponed" ("Uitgesteld"), "stopped" ("Gestopt"),
 * and "forfeited" ("FF"). Date and time are hidden when the match is postponed or stopped.
 * `className` is merged into the outer container.
 *
 * @param homeTeam - Home team data (name, optional `logo`, optional `score`)
 * @param awayTeam - Away team data (name, optional `logo`, optional `score`)
 * @param date - Match date
 * @param time - Optional time string (e.g., "HH:MM")
 * @param status - Match status; one of `"scheduled" | "finished" | "forfeited" | "postponed" | "stopped"`
 * @param competition - Optional competition name displayed as a badge
 * @param isLoading - If `true`, render a placeholder skeleton instead of match content
 * @param className - Optional additional CSS classes applied to the root element
 * @returns The rendered match header element
 */
export function MatchHeader({
  homeTeam,
  awayTeam,
  date,
  time,
  status,
  competition,
  isLoading = false,
  className,
}: MatchHeaderProps) {
  const isFinished = status === "finished";
  const isForfeited = status === "forfeited";
  const isPostponed = status === "postponed";
  const isStopped = status === "stopped";
  // Only show score block if match is finished/forfeited AND at least one score is present
  const hasScore =
    (isFinished || isForfeited) &&
    (typeof homeTeam.score === "number" || typeof awayTeam.score === "number");

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          "relative bg-gradient-to-br from-kcvv-green-dark to-kcvv-green-bright py-8 lg:py-12",
          className,
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            {/* Competition skeleton */}
            <div className="h-6 w-32 bg-white/20 rounded-full animate-pulse" />

            {/* Teams skeleton */}
            <div className="flex items-center justify-center gap-4 lg:gap-8 w-full max-w-3xl">
              {/* Home team */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/20 rounded-full animate-pulse" />
                <div className="h-5 w-24 bg-white/20 rounded animate-pulse" />
              </div>

              {/* Score */}
              <div className="h-16 w-32 bg-white/20 rounded-lg animate-pulse" />

              {/* Away team */}
              <div className="flex flex-col items-center gap-3 flex-1">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/20 rounded-full animate-pulse" />
                <div className="h-5 w-24 bg-white/20 rounded animate-pulse" />
              </div>
            </div>

            {/* Date skeleton */}
            <div className="h-5 w-40 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-kcvv-green-dark to-kcvv-green-bright py-8 lg:py-12",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Competition badge */}
          {competition && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold backdrop-blur-sm">
              {competition}
            </span>
          )}

          {/* Teams and Score */}
          <div className="flex items-center justify-center gap-4 lg:gap-8 w-full max-w-3xl">
            {/* Home Team */}
            <TeamDisplay team={homeTeam} side="home" />

            {/* Score or VS */}
            <div className="flex flex-col items-center gap-2">
              {hasScore ? (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                  <span className="text-4xl lg:text-5xl font-bold text-white font-mono">
                    {typeof homeTeam.score === "number" ? homeTeam.score : "–"}
                  </span>
                  <span className="text-2xl text-white/60">-</span>
                  <span className="text-4xl lg:text-5xl font-bold text-white font-mono">
                    {typeof awayTeam.score === "number" ? awayTeam.score : "–"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center w-20 h-14">
                  <span className="text-2xl font-bold text-white/80">VS</span>
                </div>
              )}
            </div>

            {/* Away Team */}
            <TeamDisplay team={awayTeam} side="away" />
          </div>

          {/* Status badges */}
          {isPostponed && (
            <div className="inline-flex items-center px-4 py-2 rounded-md bg-orange-500/20 border border-orange-400/50">
              <span className="text-orange-100 font-semibold text-sm uppercase tracking-wide">
                Uitgesteld
              </span>
            </div>
          )}
          {isStopped && (
            <div className="inline-flex items-center px-4 py-2 rounded-md bg-orange-500/20 border border-orange-400/50">
              <span className="text-orange-100 font-semibold text-sm uppercase tracking-wide">
                Gestopt
              </span>
            </div>
          )}
          {isForfeited && (
            <div className="inline-flex items-center px-4 py-2 rounded-md bg-gray-500/20 border border-gray-400/50">
              <span className="text-gray-100 font-semibold text-sm uppercase tracking-wide">
                FF
              </span>
            </div>
          )}

          {/* Date and Time */}
          {!isPostponed && !isStopped && (
            <div className="text-center text-white/90">
              <div className="font-semibold">{formatMatchDate(date)}</div>
              {time && <div className="text-white/70 text-sm">{time}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a team block showing the team's logo (or a placeholder) and name, aligned according to side.
 *
 * @param team - Team data including `name`, optional `logo`, and optional `score`
 * @param side - Layout side for alignment; `"home"` aligns content to the right on large screens, `"away"` aligns to the left
 */
function TeamDisplay({
  team,
  side,
}: {
  team: MatchTeamProps;
  side: "home" | "away";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 flex-1",
        side === "home" ? "lg:items-end" : "lg:items-start",
      )}
    >
      {/* Team logo */}
      <div className="w-16 h-16 lg:w-24 lg:h-24 flex items-center justify-center bg-white/10 rounded-full p-2 backdrop-blur-sm">
        {team.logo ? (
          <Image
            src={team.logo}
            alt={`${team.name} logo`}
            width={80}
            height={80}
            className="object-contain w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-8 h-8 lg:w-12 lg:h-12 text-white/40"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Team name */}
      <span
        className={cn(
          "text-white font-semibold text-sm lg:text-base text-center",
          side === "home" ? "lg:text-right" : "lg:text-left",
        )}
      >
        {team.name}
      </span>
    </div>
  );
}
