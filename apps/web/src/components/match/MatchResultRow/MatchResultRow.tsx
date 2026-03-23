/**
 * MatchResultRow Component
 *
 * A single match row card displaying teams, scores, status badges,
 * and result highlighting. Used by TeamSchedule to render each match.
 *
 * Supports light and dark themes — same card layout, different colors.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { MatchStatusBadge } from "../MatchStatusBadge";
import type { ScheduleMatch } from "../types";

export interface MatchResultRowProps {
  /** Match data */
  match: ScheduleMatch;
  /** Team ID for home/away determination and result highlighting */
  teamId?: number;
  /** Whether this is the next upcoming match */
  isNext?: boolean;
  /** Link destination for the match detail page */
  href: string;
  /** Theme variant */
  theme?: "light" | "dark";
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

type Result = "win" | "loss" | "draw" | null;

function getResult(match: ScheduleMatch, teamId: number | undefined): Result {
  const isMember =
    teamId !== undefined &&
    (match.homeTeam.id === teamId || match.awayTeam.id === teamId);
  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";

  if (!hasScore || !isMember) return null;

  const isHome = match.homeTeam.id === teamId;
  const kcvvScore = isHome ? match.homeScore! : match.awayScore!;
  const oppScore = isHome ? match.awayScore! : match.homeScore!;

  if (kcvvScore > oppScore) return "win";
  if (kcvvScore < oppScore) return "loss";
  return "draw";
}

const resultBadgeConfig: Record<
  "win" | "loss" | "draw",
  { label: string; className: string }
> = {
  win: {
    label: "W",
    className: "bg-kcvv-green-bright/15 text-kcvv-green-bright",
  },
  loss: { label: "L", className: "bg-red-500/15 text-red-400" },
  draw: { label: "G", className: "bg-yellow-500/15 text-yellow-400" },
};

/** Result-colored left border (light theme only) */
const resultBorderLight: Record<"win" | "loss" | "draw", string> = {
  win: "border-l-4 border-l-kcvv-success",
  loss: "border-l-4 border-l-kcvv-alert",
  draw: "border-l-4 border-l-kcvv-warning",
};

export function MatchResultRow({
  match,
  teamId,
  isNext = false,
  href,
  theme = "light",
}: MatchResultRowProps) {
  const isDark = theme === "dark";
  const isMember =
    teamId !== undefined &&
    (match.homeTeam.id === teamId || match.awayTeam.id === teamId);
  const isHome = isMember && match.homeTeam.id === teamId;
  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";

  const result = getResult(match, teamId);

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg p-4 transition-shadow",
        isDark
          ? cn(
              "bg-white/[0.03] hover:bg-white/[0.07]",
              isNext && "ring-2 ring-kcvv-green-bright/30",
            )
          : cn(
              "bg-white border hover:shadow-md",
              isNext
                ? "border-kcvv-green-bright ring-2 ring-kcvv-green-bright/20"
                : "border-gray-200",
              result && resultBorderLight[result],
            ),
      )}
    >
      {/* Header row: date, time, competition */}
      <div className="flex items-center justify-between text-sm mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium",
              isDark ? "text-white/70" : "text-gray-900",
            )}
          >
            {formatDate(match.date)}
          </span>
          {match.time && (
            <span className={isDark ? "text-white/50" : "text-gray-500"}>
              {match.time}
            </span>
          )}
          <MatchStatusBadge status={match.status} isDark={isDark} />
          {isNext && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                isDark
                  ? "bg-kcvv-green-bright text-kcvv-black"
                  : "bg-kcvv-green-bright text-white",
              )}
            >
              Volgende
            </span>
          )}
        </div>
        {match.competition && (
          <span
            className={cn(
              "text-xs hidden sm:block",
              isDark ? "text-white/40" : "text-gray-500",
            )}
          >
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
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isDark ? "bg-white/10" : "bg-gray-200",
              )}
            >
              <span
                className={cn(
                  "text-xs",
                  isDark ? "text-white/40" : "text-gray-500",
                )}
              >
                {match.homeTeam.name.charAt(0)}
              </span>
            </div>
          )}
          <span
            className={cn(
              "truncate text-sm",
              isDark
                ? isMember && match.homeTeam.id === teamId
                  ? "font-semibold text-white"
                  : "text-white/85"
                : isMember && match.homeTeam.id === teamId
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
                  isDark ? "text-white" : undefined,
                  teamId !== undefined &&
                    match.homeTeam.id === teamId &&
                    match.homeScore! > match.awayScore! &&
                    "text-kcvv-green-bright",
                )}
              >
                {match.homeScore}
              </span>
              <span className={isDark ? "text-white/30" : "text-gray-400"}>
                -
              </span>
              <span
                className={cn(
                  isDark ? "text-white" : undefined,
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
            <span
              className={cn(
                "font-medium",
                isDark ? "text-white/30" : "text-gray-400",
              )}
            >
              VS
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span
            className={cn(
              "truncate text-sm text-right",
              isDark
                ? isMember && match.awayTeam.id === teamId
                  ? "font-semibold text-white"
                  : "text-white/85"
                : isMember && match.awayTeam.id === teamId
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
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isDark ? "bg-white/10" : "bg-gray-200",
              )}
            >
              <span
                className={cn(
                  "text-xs",
                  isDark ? "text-white/40" : "text-gray-500",
                )}
              >
                {match.awayTeam.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Result badge */}
        {result && (
          <div className="flex-shrink-0 ml-3">
            <span
              className={cn(
                "inline-block text-[11px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-sm",
                resultBadgeConfig[result].className,
              )}
            >
              {resultBadgeConfig[result].label}
            </span>
          </div>
        )}
      </div>

      {/* Home/Away indicator for mobile */}
      <div
        className={cn(
          "mt-2 text-xs sm:hidden",
          isDark ? "text-white/40" : "text-gray-500",
        )}
      >
        {isMember && `${isHome ? "Thuis" : "Uit"} · `}
        {match.competition ?? "Competitie"}
      </div>
    </Link>
  );
}
