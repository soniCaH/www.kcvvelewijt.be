"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { UpcomingMatch } from "@/components/match/types";
import { KCVV_FIRST_TEAM_CLUB_ID } from "@/lib/constants";
import { formatWidgetDate } from "@/lib/utils/dates";

const STORAGE_KEY = "matchStripDismissed";

const listeners = new Set<() => void>();
const subscribeDismissed = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
const getSnapshot = () => sessionStorage.getItem(STORAGE_KEY) === "true";
const getServerSnapshot = () => false;

export interface MatchStripClientProps {
  match: UpcomingMatch | null;
}

export function MatchStripClient({ match }: MatchStripClientProps) {
  const isDismissed = useSyncExternalStore(
    subscribeDismissed,
    getSnapshot,
    getServerSnapshot,
  );

  if (isDismissed || !match) return null;

  const isFinished =
    match.status === "finished" || match.status === "forfeited";
  const href = `/wedstrijd/${match.id}`;

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    listeners.forEach((fn) => fn());
  };

  return (
    <div className="bg-kcvv-green-dark text-white min-h-[40px]">
      <div className="flex items-center min-h-[40px]">
        <Link
          href={href}
          className="flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-kcvv-green-dark-hover transition-colors min-h-[40px]"
        >
          {isFinished ? (
            <FinishedLine match={match} />
          ) : (
            <ScheduledLine match={match} />
          )}
          {match.competition && (
            <span className="hidden md:inline text-white/60 text-xs before:content-['·'] before:mx-2 before:text-white/40">
              {match.competition}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Verberg wedstrijdstrip"
          className="flex items-center justify-center px-3 py-2 text-white/60 hover:text-white transition-colors min-h-[40px]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function FinishedLine({ match }: { match: UpcomingMatch }) {
  const dateStr = formatWidgetDate(match.date);
  return (
    <>
      <span className="text-white/60 text-xs">{dateStr}</span>
      <span className="font-bold">{match.homeTeam.name}</span>
      <span className="font-mono font-bold">{match.homeTeam.score ?? "-"}</span>
      <span className="text-white/50">–</span>
      <span className="font-mono font-bold">{match.awayTeam.score ?? "-"}</span>
      <span className="font-bold">{match.awayTeam.name}</span>
    </>
  );
}

function ScheduledLine({ match }: { match: UpcomingMatch }) {
  const opponent =
    match.homeTeam.id === KCVV_FIRST_TEAM_CLUB_ID
      ? match.awayTeam.name
      : match.homeTeam.name;
  const timeStr = match.time
    ? ` · ${formatWidgetDate(match.date)} ${match.time}`
    : ` · ${formatWidgetDate(match.date)}`;

  return (
    <>
      <span className="text-white/80">Volgende:</span>
      <span className="truncate font-bold">vs {opponent}</span>
      <span className="text-white/60 text-xs shrink-0">{timeStr}</span>
    </>
  );
}
