/**
 * MatchResultRow Component
 *
 * A single match row for dark schedule sections. Grid layout with
 * date, teams, score, and result badge (W/L/G).
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
}

/**
 * Format date in Dutch locale (short weekday + day + short month)
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

export function MatchResultRow({
  match,
  teamId,
  isNext = false,
  href,
}: MatchResultRowProps) {
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
        "grid grid-cols-[140px_1fr_auto_1fr_80px] items-center gap-4 px-5 py-3.5 rounded-sm transition-colors",
        "border-l-[3px] border-l-transparent",
        "bg-white/[0.03]",
        "hover:border-l-kcvv-green-bright hover:bg-white/[0.07]",
        isNext && "bg-kcvv-green-bright/[0.07] border-l-kcvv-green-bright",
      )}
    >
      {/* Date + next badge */}
      <span className="text-[13px] font-semibold text-white/50">
        {formatDate(match.date)}
        <MatchStatusBadge status={match.status} isDark />
        {isNext && (
          <span className="ml-1.5 inline-block bg-kcvv-green-bright text-kcvv-black text-[9px] font-bold uppercase tracking-wider rounded-sm px-1.5 py-0.5">
            Volgende
          </span>
        )}
      </span>

      {/* Home team */}
      <span className="flex items-center gap-2 min-w-0">
        {match.homeTeam.logo ? (
          <Image
            src={match.homeTeam.logo}
            alt={`${match.homeTeam.name} logo`}
            width={24}
            height={24}
            className="object-contain flex-shrink-0"
          />
        ) : (
          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[10px] text-white/40">
            {match.homeTeam.name.charAt(0)}
          </span>
        )}
        <span
          className={cn(
            "truncate text-sm font-bold uppercase tracking-[0.02em]",
            isMember && match.homeTeam.id === teamId
              ? "text-white"
              : "text-white/85",
          )}
        >
          {match.homeTeam.name}
        </span>
      </span>

      {/* Score or VS */}
      <span className="text-center min-w-[60px]">
        {hasScore ? (
          <span className="font-mono font-extrabold text-lg text-white tracking-widest">
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">
            vs
          </span>
        )}
      </span>

      {/* Away team */}
      <span className="flex items-center gap-2 min-w-0 justify-end">
        <span
          className={cn(
            "truncate text-sm font-bold uppercase tracking-[0.02em] text-right",
            isMember && match.awayTeam.id === teamId
              ? "text-white"
              : "text-white/85",
          )}
        >
          {match.awayTeam.name}
        </span>
        {match.awayTeam.logo ? (
          <Image
            src={match.awayTeam.logo}
            alt={`${match.awayTeam.name} logo`}
            width={24}
            height={24}
            className="object-contain flex-shrink-0"
          />
        ) : (
          <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[10px] text-white/40">
            {match.awayTeam.name.charAt(0)}
          </span>
        )}
      </span>

      {/* Result badge or time */}
      <span className="text-right">
        {result ? (
          <span
            className={cn(
              "inline-block text-[11px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-sm",
              resultBadgeConfig[result].className,
            )}
          >
            {resultBadgeConfig[result].label}
          </span>
        ) : (
          <span className="text-white/30 text-sm">{match.time ?? ""}</span>
        )}
      </span>

      {/* Mobile: home/away + competition */}
      <span className="col-span-full text-xs text-white/40 sm:hidden -mt-2">
        {isMember && `${isHome ? "Thuis" : "Uit"} · `}
        {match.competition ?? "Competitie"}
      </span>
    </Link>
  );
}
