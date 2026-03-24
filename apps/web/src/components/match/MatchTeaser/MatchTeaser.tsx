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
import { MatchStatusBadge } from "../MatchStatusBadge";

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
          "border rounded",
          isDark ? "bg-white/8 border-white/8" : "bg-white border-gray-200",
          isCompact ? "p-5" : "p-4",
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

  const containerClasses = cn(
    "block border rounded transition-shadow",
    isDark
      ? "bg-white/8 border-white/8 hover:border-white/20"
      : "bg-white border-gray-200 hover:shadow-md",
    isCompact ? "p-5" : "p-4",
    className,
  );

  const content = isCompact ? (
    // COMPACT VARIANT — vertical team stack
    <>
      {/* Header: team label left + date right */}
      <div className="flex items-start justify-between mb-4">
        {teamLabel ? (
          <span
            data-testid="team-label"
            className="text-xs font-bold uppercase tracking-label text-kcvv-green-bright"
          >
            {teamLabel}
          </span>
        ) : (
          <span />
        )}
        <span
          className={cn(
            "text-[11px] font-semibold",
            isDark ? "text-white/30" : "text-gray-500",
          )}
        >
          {formatDate(date)}
        </span>
      </div>

      {/* Home team */}
      <div className="flex items-center gap-3 h-10">
        <CompactLogo
          team={homeTeam}
          isHighlighted={isHomeHighlighted}
          isDark={isDark}
        />
        <span
          className={cn(
            "text-[13px] font-semibold truncate",
            isDark
              ? isHomeHighlighted
                ? "text-white"
                : "text-white/60"
              : isHomeHighlighted
                ? "text-gray-900"
                : "text-gray-500",
          )}
        >
          {homeTeam.name}
        </span>
      </div>

      {/* "vs" separator — indented past logo */}
      <div className="pl-11 flex items-center">
        <span
          className={cn(
            "text-sm font-bold",
            isDark ? "text-white/30" : "text-gray-300",
          )}
        >
          vs
        </span>
      </div>

      {/* Away team */}
      <div className="flex items-center gap-3 h-10 mb-5">
        <CompactLogo
          team={awayTeam}
          isHighlighted={isAwayHighlighted}
          isDark={isDark}
        />
        <span
          className={cn(
            "text-[13px] font-semibold truncate",
            isDark
              ? isAwayHighlighted
                ? "text-white"
                : "text-white/60"
              : isAwayHighlighted
                ? "text-gray-900"
                : "text-gray-500",
          )}
        >
          {awayTeam.name}
        </span>
      </div>

      {/* Divider */}
      <div
        className={cn(
          "border-t mb-3",
          isDark ? "border-white/10" : "border-gray-100",
        )}
      />

      {/* Footer: time · venue (upcoming) or time · status badge */}
      <div
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-semibold",
          isDark ? "text-white/30" : "text-gray-500",
        )}
      >
        {time && <span>{time}</span>}
        {time && status !== "upcoming" && status !== "finished" && (
          <span aria-hidden="true">·</span>
        )}
        <MatchStatusBadge status={status} isDark={isDark} />
        {venue && status === "upcoming" && time && (
          <span aria-hidden="true">·</span>
        )}
        {venue && status === "upcoming" && <span>{venue}</span>}
      </div>
    </>
  ) : (
    // DEFAULT VARIANT — horizontal layout
    <>
      {teamLabel && (
        <div
          data-testid="team-label"
          className="mb-1 text-xs font-bold uppercase tracking-widest text-kcvv-green-bright"
        >
          {teamLabel}
        </div>
      )}

      {/* Header: Date, time, status */}
      <div className="flex items-center justify-between text-sm mb-3">
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
          <MatchStatusBadge status={status} isDark={isDark} />
        </div>
        {venue && (
          <span className="text-gray-500 text-xs hidden sm:block">{venue}</span>
        )}
      </div>

      {/* Teams and score */}
      <div className="flex items-center justify-between">
        <TeamDisplay
          team={homeTeam}
          side="home"
          isHighlighted={isHomeHighlighted}
          compact={false}
          isDark={isDark}
        />

        <div className="shrink-0 px-3">
          {hasScore ? (
            <div className="flex items-center gap-2 font-mono font-bold text-lg">
              <span
                className={cn(
                  isHomeHighlighted && score.home > score.away
                    ? "text-kcvv-green-bright"
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
                    ? "text-kcvv-green-bright"
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

        <TeamDisplay
          team={awayTeam}
          side="away"
          isHighlighted={isAwayHighlighted}
          compact={false}
          isDark={isDark}
        />
      </div>

      {venue && (
        <div className="mt-2 text-xs text-gray-500 sm:hidden">{venue}</div>
      )}
    </>
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
 * Logo for compact variant — bare image (no container), circle letter fallback
 */
function CompactLogo({
  team,
  isHighlighted,
  isDark,
}: {
  team: MatchTeaserTeam;
  isHighlighted?: boolean;
  isDark?: boolean;
}) {
  if (team.logo) {
    return (
      <Image
        src={team.logo}
        alt=""
        width={32}
        height={32}
        className="w-8 h-8 shrink-0 object-contain"
      />
    );
  }
  return (
    <div
      className={cn(
        "w-8 h-8 shrink-0 flex items-center justify-center text-sm font-bold rounded-full",
        isHighlighted
          ? isDark
            ? "bg-kcvv-green/20 text-kcvv-green-bright"
            : "bg-kcvv-green/15 text-kcvv-green-dark"
          : isDark
            ? "bg-white/10 text-white/40"
            : "bg-gray-200 text-gray-500",
      )}
    >
      {team.name.charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Renders team logo and name (default variant)
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
          className="object-contain shrink-0"
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center shrink-0",
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
