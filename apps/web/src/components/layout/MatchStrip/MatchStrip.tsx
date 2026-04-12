import Link from "next/link";
import type { UpcomingMatch } from "@/components/match/types";
import { KCVV_FIRST_TEAM_CLUB_ID } from "@/lib/constants";
import { formatWidgetDate } from "@/lib/utils/dates";

export interface MatchStripProps {
  match: UpcomingMatch | null;
}

export function MatchStrip({ match }: MatchStripProps) {
  if (!match) return null;

  const isFinished =
    match.status === "finished" || match.status === "forfeited";

  const href = `/wedstrijd/${match.id}`;

  return (
    <div className="bg-kcvv-green-dark text-white">
      <Link
        href={href}
        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium hover:bg-kcvv-green-dark-hover transition-colors min-h-[40px]"
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
    </div>
  );
}

function FinishedLine({ match }: { match: UpcomingMatch }) {
  const dateStr = formatWidgetDate(match.date);
  return (
    <>
      <span className="text-white/60 text-xs">{dateStr}</span>
      <span className="font-bold">{match.homeTeam.name}</span>
      <span className="font-mono font-bold">{match.homeTeam.score}</span>
      <span className="text-white/50">–</span>
      <span className="font-mono font-bold">{match.awayTeam.score}</span>
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
      <span className="font-bold">vs {opponent}</span>
      <span className="text-white/60 text-xs">{timeStr}</span>
    </>
  );
}
