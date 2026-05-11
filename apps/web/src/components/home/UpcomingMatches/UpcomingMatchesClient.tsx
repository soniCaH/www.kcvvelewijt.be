"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatWidgetDate } from "@/lib/utils/dates";
import { MonoLabel } from "@/components/design-system";
import type { UpcomingMatch } from "@/components/match/types";

export interface UpcomingMatchesClientProps {
  matches: UpcomingMatch[];
  initialVisible: number;
  kcvvTeamId: number;
  initialExpanded?: boolean;
}

export const UpcomingMatchesClient = ({
  matches,
  initialVisible,
  kcvvTeamId,
  initialExpanded = false,
}: UpcomingMatchesClientProps) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const total = matches.length;
  const showExpandButton = total > initialVisible && !expanded;
  const visible = expanded ? matches : matches.slice(0, initialVisible);

  return (
    <>
      <ul className="flex flex-col gap-3">
        {visible.map((match) => (
          <li key={match.id}>
            <MatchRow match={match} kcvvTeamId={kcvvTeamId} />
          </li>
        ))}
      </ul>

      {showExpandButton && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="border-ink bg-cream-soft text-ink shadow-paper-sm focus-visible:outline-ink mt-6 w-full border-2 px-4 py-3 font-mono text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 md:w-auto"
        >
          Toon alle {total} wedstrijden ↓
        </button>
      )}

      {expanded && (
        <div className="mt-6">
          <Link
            href="/kalender"
            className="text-ink hover:text-jersey-deep inline-flex items-center gap-1 font-mono text-sm font-bold tracking-wide uppercase underline-offset-4 hover:underline"
          >
            Volledige kalender ↗
          </Link>
        </div>
      )}
    </>
  );
};

interface MatchRowProps {
  match: UpcomingMatch;
  kcvvTeamId: number;
}

const MatchRow = ({ match, kcvvTeamId }: MatchRowProps) => {
  const isHome = match.homeTeam.id === kcvvTeamId;
  const homeIsKcvv = match.homeTeam.id === kcvvTeamId;
  const awayIsKcvv = match.awayTeam.id === kcvvTeamId;
  const teamLabel = match.teamLabel || match.kcvvTeamLabel || match.squadLabel;
  const dateLabel = formatWidgetDate(match.date);
  const when = [dateLabel, match.time].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      className={cn(
        "border-ink bg-cream group relative grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-2 px-4 py-3",
        "shadow-paper-sm transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
        "focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2",
        "sm:grid-cols-[auto_1fr_auto] sm:gap-x-4",
      )}
    >
      <span className="text-ink/70 col-span-1 row-start-1 font-mono text-xs font-bold tracking-wide uppercase sm:col-auto sm:row-auto sm:min-w-[10rem]">
        {when}
      </span>

      <span className="text-ink col-span-2 row-start-2 font-sans text-base leading-tight sm:col-auto sm:row-auto">
        <span className={cn(homeIsKcvv && "font-bold")}>
          {match.homeTeam.name}
        </span>
        <span className="text-ink/60 mx-2">—</span>
        <span className={cn(awayIsKcvv && "font-bold")}>
          {match.awayTeam.name}
        </span>
        {(teamLabel || match.competition) && (
          <span className="text-ink/60 mt-0.5 block text-xs font-medium">
            {[teamLabel, match.competition].filter(Boolean).join(" · ")}
          </span>
        )}
      </span>

      <span className="col-start-2 row-start-1 sm:col-auto sm:row-auto">
        <MonoLabel variant={isHome ? "pill-jersey" : "pill-ink"} size="sm">
          {isHome ? "THUIS" : "UIT"}
        </MonoLabel>
      </span>
    </Link>
  );
};
