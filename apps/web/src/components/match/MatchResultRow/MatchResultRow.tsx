/**
 * MatchResultRow Component
 *
 * A single match row card displaying teams, scores, status badges,
 * and result highlighting. Used by TeamSchedule to render each match.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { MatchStatusBadge } from "../MatchStatusBadge";
import type { ScheduleMatch } from "../../team/TeamSchedule/TeamSchedule";

export interface MatchResultRowProps {
  /** Match data */
  match: ScheduleMatch;
  /** Team ID for home/away determination and result highlighting */
  teamId?: number;
  /** Whether this is the next upcoming match */
  isNext?: boolean;
  /** Link destination for the match detail page */
  href: string;
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

export function MatchResultRow({
  match,
  teamId,
  isNext = false,
  href,
}: MatchResultRowProps) {
  const isHome = teamId !== undefined && match.homeTeam.id === teamId;
  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";

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

  return (
    <Link
      href={href}
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
          {match.time && <span className="text-gray-500">{match.time}</span>}
          <MatchStatusBadge status={match.status} />
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
}
