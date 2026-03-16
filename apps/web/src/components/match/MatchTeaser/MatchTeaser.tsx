/**
 * MatchTeaser Component
 *
 * Compact match preview for lists and schedules.
 *
 * Features:
 * - Team names and optional logos
 * - Date and time display
 * - Score display for finished/forfeited matches
 * - Status badges (Postponed, Stopped, Forfeited)
 * - Compact variant for tight spaces
 * - Link to match detail page
 */

import Image from "next/image";
import Link from "next/link";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils/cn";

export interface MatchTeaserTeam {
  /** Team ID for identification and highlighting */
  id?: string | number;
  /** Team name */
  name: string;
  /** Team logo URL */
  logo?: string;
}

export interface MatchTeaserProps {
  /** Home team info */
  homeTeam: MatchTeaserTeam;
  /** Away team info */
  awayTeam: MatchTeaserTeam;
  /** Match date (ISO string or YYYY-MM-DD) */
  date: string;
  /** Match time (HH:MM format) */
  time?: string;
  /** Venue name */
  venue?: string;
  /** Score for live/finished matches */
  score?: { home: number; away: number };
  /** Match status */
  status: "upcoming" | "finished" | "forfeited" | "postponed" | "stopped";
  /** Link to match detail page */
  href?: string;
  /** Team ID to highlight (must match team.id) */
  highlightTeamId?: string | number;
  /** Display variant */
  variant?: "default" | "compact";
  /** Optional team label shown as a small green badge above the date row (e.g. "A-Ploeg") */
  teamLabel?: string;
  /** Theme variant — "dark" for dark-background sections */
  theme?: "light" | "dark";
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format date for display using Luxon (timezone-safe)
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const dt = DateTime.fromISO(dateStr);
    if (!dt.isValid) {
      return dateStr;
    }
    // Format: "do 15 feb" (short weekday, numeric day, short month)
    return dt.setLocale("nl").toFormat("ccc d MMM");
  } catch {
    return dateStr;
  }
}

/**
 * Render a compact match preview showing teams, date, score, and status.
 *
 * @param homeTeam - Home team info (name and optional logo)
 * @param awayTeam - Away team info (name and optional logo)
 * @param date - Match date in ISO or YYYY-MM-DD format
 * @param time - Optional match time in HH:MM format
 * @param venue - Optional venue name
 * @param score - Optional score object for live/finished matches
 * @param status - Match status: "upcoming" (scheduled, not yet played), "finished" (played with score),
 *   "forfeited" (FF result, may have score), "postponed" (Uitgesteld), "stopped" (Gestopt, ended prematurely)
 * @param href - Optional link to match detail page
 * @param highlightTeamId - Optional team ID to highlight
 * @param variant - Display variant (default or compact)
 * @param isLoading - Show loading skeleton
 * @param className - Additional CSS classes
 * @returns The rendered match teaser element
 */
export function MatchTeaser({
  homeTeam,
  awayTeam,
  date,
  time,
  venue,
  score,
  status,
  href,
  highlightTeamId,
  teamLabel,
  theme,
  variant = "default",
  isLoading = false,
  className,
}: MatchTeaserProps) {
  const isCompact = variant === "compact";
  const isDark = theme === "dark";
  const hasScore = !!score;

  // Check if either team should be highlighted (strict ID equality)
  const isHomeHighlighted =
    highlightTeamId !== undefined &&
    homeTeam.id !== undefined &&
    String(highlightTeamId) === String(homeTeam.id);
  const isAwayHighlighted =
    highlightTeamId !== undefined &&
    awayTeam.id !== undefined &&
    String(highlightTeamId) === String(awayTeam.id);

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white border border-gray-200 rounded-lg",
          isCompact ? "p-3" : "p-4",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <>
      {teamLabel && (
        <div
          data-testid="team-label"
          className="mb-1 text-xs font-bold uppercase tracking-widest text-kcvv-green"
        >
          {teamLabel}
        </div>
      )}

      {/* Header: Date, time, status */}
      <div
        className={cn(
          "flex items-center justify-between text-sm",
          isCompact ? "mb-2" : "mb-3",
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium",
              isDark ? "text-white/70" : "text-gray-900",
            )}
          >
            {formatDate(date)}
          </span>
          {time && (
            <span className={cn(isDark ? "text-white/50" : "text-gray-500")}>
              {time}
            </span>
          )}
          <StatusBadge status={status} isDark={isDark} />
        </div>
        {venue && !isCompact && (
          <span className="text-gray-500 text-xs hidden sm:block">{venue}</span>
        )}
      </div>

      {/* Teams and score */}
      <div className="flex items-center justify-between">
        {/* Home team */}
        <TeamDisplay
          team={homeTeam}
          side="home"
          isHighlighted={isHomeHighlighted}
          compact={isCompact}
          isDark={isDark}
        />

        {/* Score or VS */}
        <div className="flex-shrink-0 px-3">
          {hasScore ? (
            <div
              className={cn(
                "flex items-center gap-2 font-mono font-bold",
                isCompact ? "text-base" : "text-lg",
              )}
            >
              <span
                className={cn(
                  isHomeHighlighted && score.home > score.away
                    ? "text-kcvv-green"
                    : isDark
                      ? "text-white"
                      : "text-gray-900",
                )}
              >
                {score.home}
              </span>
              <span className={cn(isDark ? "text-white/30" : "text-gray-400")}>
                -
              </span>
              <span
                className={cn(
                  isAwayHighlighted && score.away > score.home
                    ? "text-kcvv-green"
                    : isDark
                      ? "text-white"
                      : "text-gray-900",
                )}
              >
                {score.away}
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
        <TeamDisplay
          team={awayTeam}
          side="away"
          isHighlighted={isAwayHighlighted}
          compact={isCompact}
          isDark={isDark}
        />
      </div>

      {/* Venue on mobile */}
      {venue && !isCompact && (
        <div className="mt-2 text-xs text-gray-500 sm:hidden">{venue}</div>
      )}
    </>
  );

  const containerClasses = cn(
    "block border rounded transition-shadow",
    isDark
      ? "bg-kcvv-black border-white/8 hover:border-white/20"
      : "bg-white border-gray-200 hover:shadow-md",
    isCompact ? "p-3" : "p-4",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}

/**
 * Renders status badge for match
 */
function StatusBadge({
  status,
  isDark,
}: {
  status: MatchTeaserProps["status"];
  isDark?: boolean;
}) {
  if (status === "postponed") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium",
          isDark
            ? "bg-orange-900/40 text-orange-300"
            : "bg-orange-100 text-orange-800",
        )}
      >
        Uitgesteld
      </span>
    );
  }
  if (status === "stopped") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium",
          isDark
            ? "bg-orange-900/40 text-orange-300"
            : "bg-orange-100 text-orange-800",
        )}
      >
        Gestopt
      </span>
    );
  }
  if (status === "forfeited") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium",
          isDark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-700",
        )}
      >
        FF
      </span>
    );
  }
  return null;
}

/**
 * Renders team logo and name
 */
function TeamDisplay({
  team,
  side,
  isHighlighted,
  compact,
  isDark,
}: {
  team: MatchTeaserTeam;
  side: "home" | "away";
  isHighlighted?: boolean;
  compact?: boolean;
  isDark?: boolean;
}) {
  const logoSize = compact ? 24 : 32;

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-1 min-w-0",
        side === "away" && "flex-row-reverse",
      )}
    >
      {team.logo ? (
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          width={logoSize}
          height={logoSize}
          className="object-contain flex-shrink-0"
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center flex-shrink-0",
            compact ? "w-6 h-6" : "w-8 h-8",
            isDark ? "bg-white/15" : "bg-gray-200",
          )}
        >
          <span
            className={cn(
              compact ? "text-xs" : "text-sm",
              isDark ? "text-white/60" : "text-gray-500",
            )}
          >
            {team.name.charAt(0)}
          </span>
        </div>
      )}
      <span
        title={team.name}
        className={cn(
          "truncate",
          compact ? "text-sm" : "text-base",
          side === "away" && "text-right",
          isDark
            ? isHighlighted
              ? "font-bold text-white"
              : "text-white/85"
            : isHighlighted
              ? "font-semibold text-gray-900"
              : "text-gray-700",
        )}
      >
        {team.name}
      </span>
    </div>
  );
}
