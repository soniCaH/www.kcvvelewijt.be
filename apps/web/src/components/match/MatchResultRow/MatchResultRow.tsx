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
import { getResultColor } from "@/lib/utils/match-display";
import { MatchStatusBadge } from "../MatchStatusBadge";
import type { ScheduleMatch } from "../types";

export interface MatchResultRowProps {
  /** Match data */
  match: ScheduleMatch;
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

function hasScores(
  match: ScheduleMatch,
): match is ScheduleMatch & { homeScore: number; awayScore: number } {
  return (
    typeof match.homeScore === "number" && typeof match.awayScore === "number"
  );
}

function getResult(match: ScheduleMatch): Result {
  if (!hasScores(match) || match.isHome === undefined) return null;
  return getResultColor(match.homeScore, match.awayScore, match.isHome);
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
  isNext = false,
  href,
  theme = "light",
}: MatchResultRowProps) {
  const isDark = theme === "dark";
  const isMember = match.isHome !== undefined;
  const isHome = match.isHome ?? false;
  const scored = hasScores(match);
  const homeScore = scored ? match.homeScore : undefined;
  const awayScore = scored ? match.awayScore : undefined;

  const result = getResult(match);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-card block p-4 transition-shadow",
        isDark
          ? cn(
              "bg-white/[0.03] hover:bg-white/[0.07]",
              isNext && "ring-kcvv-green-bright/30 ring-2",
            )
          : cn(
              "border bg-white hover:shadow-md",
              isNext
                ? "border-kcvv-green-bright ring-kcvv-green-bright/20 ring-2"
                : "border-gray-200",
              result && resultBorderLight[result],
            ),
      )}
    >
      {/* Header row: date, time, competition (sm+ only — footer shows it on mobile).
         Competition is intentionally hidden on mobile (hidden sm:block) to avoid
         duplication with the footer line. Do NOT remove sm:block. */}
      <div className="mb-3 flex items-center justify-between text-sm">
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
                "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
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
              "hidden text-xs sm:block",
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
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {match.homeTeam.logo ? (
            <Image
              src={match.homeTeam.logo}
              alt={`${match.homeTeam.name} logo`}
              width={32}
              height={32}
              className="flex-shrink-0 object-contain"
            />
          ) : (
            <div
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
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
                ? isMember && isHome
                  ? "font-semibold text-white"
                  : "text-white/85"
                : isMember && isHome
                  ? "font-semibold"
                  : "text-gray-700",
            )}
          >
            {match.homeTeam.name}
          </span>
        </div>

        {/* Score or VS */}
        <div className="flex-shrink-0 px-4">
          {homeScore !== undefined && awayScore !== undefined ? (
            <div className="flex items-center gap-2 font-mono text-lg font-bold">
              <span
                className={cn(
                  isDark ? "text-white" : undefined,
                  isMember &&
                    isHome &&
                    homeScore > awayScore &&
                    "text-kcvv-green-bright",
                )}
              >
                {homeScore}
              </span>
              <span className={isDark ? "text-white/30" : "text-gray-400"}>
                -
              </span>
              <span
                className={cn(
                  isDark ? "text-white" : undefined,
                  isMember &&
                    !isHome &&
                    awayScore > homeScore &&
                    "text-kcvv-green-bright",
                )}
              >
                {awayScore}
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
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span
            className={cn(
              "truncate text-right text-sm",
              isDark
                ? isMember && !isHome
                  ? "font-semibold text-white"
                  : "text-white/85"
                : isMember && !isHome
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
              className="flex-shrink-0 object-contain"
            />
          ) : (
            <div
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
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
          <div className="ml-3 flex-shrink-0">
            <span
              className={cn(
                "inline-block rounded-sm px-2 py-0.5 text-[11px] font-bold tracking-[0.06em] uppercase",
                resultBadgeConfig[result].className,
              )}
            >
              {resultBadgeConfig[result].label}
            </span>
          </div>
        )}
      </div>

      {/* Home/Away indicator (all breakpoints) + competition (mobile only via sm:hidden,
         header shows competition on sm+). Do NOT remove sm:hidden — causes duplication. */}
      {isMember && (
        <div
          className={cn(
            "mt-2 text-xs",
            isDark ? "text-white/40" : "text-gray-500",
          )}
        >
          {isHome ? "Thuis" : "Uit"}
          <span className="sm:hidden">
            {` · ${match.competition ?? "Competitie"}`}
          </span>
        </div>
      )}
    </Link>
  );
}
