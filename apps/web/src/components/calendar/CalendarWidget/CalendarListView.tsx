"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { DateTime } from "luxon";
import { MatchStatusBadge } from "@/components/match/MatchStatusBadge";
import type { CalendarMatch } from "@/app/(main)/kalender/utils";

function formatDayHeader(dateStr: string): string {
  return DateTime.fromISO(dateStr).toLocaleString(
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    { locale: "nl-BE" },
  );
}

function MatchRow({ match }: { match: CalendarMatch }) {
  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-green-main hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-2">
          {match.team && (
            <span className="font-semibold text-green-main">{match.team}</span>
          )}
          {match.competition && (
            <span className="hidden sm:inline">{match.competition}</span>
          )}
          <MatchStatusBadge status={match.status} />
        </div>
        {match.time && <span>{match.time}</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.homeTeam.logo ? (
            <Image
              src={match.homeTeam.logo}
              alt={`${match.homeTeam.name} logo`}
              width={28}
              height={28}
              className="object-contain shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-xs text-gray-400">
                {match.homeTeam.name.charAt(0)}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-900 truncate">
            {match.homeTeam.name}
          </span>
        </div>

        <div className="shrink-0 px-3 text-center">
          {match.scoreDisplay.type === "score" ? (
            <span className="font-mono font-bold text-lg tabular-nums">
              {match.scoreDisplay.home} - {match.scoreDisplay.away}
            </span>
          ) : (
            <span className="text-gray-400 font-medium text-sm">VS</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium text-gray-900 truncate text-right">
            {match.awayTeam.name}
          </span>
          {match.awayTeam.logo ? (
            <Image
              src={match.awayTeam.logo}
              alt={`${match.awayTeam.name} logo`}
              width={28}
              height={28}
              className="object-contain shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-xs text-gray-400">
                {match.awayTeam.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CalendarListView({ matches }: { matches: CalendarMatch[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarMatch[]>();
    for (const m of matches) {
      const day = DateTime.fromISO(m.date).toISODate()!;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [matches]);

  if (grouped.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg">Geen wedstrijden gevonden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map(([day, dayMatches]) => (
        <div key={day}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {formatDayHeader(day)}
          </h2>
          <div className="space-y-3">
            {dayMatches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
