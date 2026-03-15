"use client";

/**
 * CalendarView — client component for match calendar
 * Handles team filtering via URL search params and grouped display
 */

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DateTime } from "luxon";
import { FilterTabs, type FilterTab } from "@/components/design-system";

export interface CalendarTeam {
  id: number;
  name: string;
  logo?: string;
}

export interface CalendarMatch {
  id: number;
  date: string; // ISO string
  time?: string;
  homeTeam: CalendarTeam;
  awayTeam: CalendarTeam;
  homeScore?: number;
  awayScore?: number;
  status: "scheduled" | "finished" | "forfeited" | "postponed" | "stopped";
  competition?: string;
  team?: string; // "A-ploeg" | "B-ploeg" | "U15 A" | etc.
}

function formatDayHeader(dateStr: string): string {
  return DateTime.fromISO(dateStr).toLocaleString(
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    { locale: "nl-BE" },
  );
}

function StatusBadge({ status }: { status: CalendarMatch["status"] }) {
  if (status === "postponed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
        Uitgesteld
      </span>
    );
  }
  if (status === "stopped") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
        Gestopt
      </span>
    );
  }
  if (status === "forfeited") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
        FF
      </span>
    );
  }
  return null;
}

function MatchRow({ match }: { match: CalendarMatch }) {
  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";

  return (
    <Link
      href={`/game/${match.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-green-main hover:shadow-sm transition-all"
    >
      {/* Header: team label + competition + time */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-2">
          {match.team && (
            <span className="font-semibold text-green-main">{match.team}</span>
          )}
          {match.competition && (
            <span className="hidden sm:inline">{match.competition}</span>
          )}
          <StatusBadge status={match.status} />
        </div>
        {match.time && <span>{match.time}</span>}
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
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

        {/* Score / VS */}
        <div className="shrink-0 px-3 text-center">
          {hasScore ? (
            <span className="font-mono font-bold text-lg tabular-nums">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-gray-400 font-medium text-sm">VS</span>
          )}
        </div>

        {/* Away team */}
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

export function CalendarView({ matches }: { matches: CalendarMatch[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTeam = searchParams.get("team") ?? "all";

  // Derive sorted team list from data
  const teams = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const m of matches) {
      if (m.team && !seen.has(m.team)) {
        seen.add(m.team);
        list.push(m.team);
      }
    }
    // Sort: A-ploeg, B-ploeg first, then youth alphabetically
    return list.sort((a, b) => {
      const order = ["A-ploeg", "B-ploeg"];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [matches]);

  // Filter matches
  const filtered = useMemo(
    () =>
      activeTeam === "all"
        ? matches
        : matches.filter((m) => m.team === activeTeam),
    [matches, activeTeam],
  );

  // Group by local date (YYYY-MM-DD key via Luxon).
  // fromISO respects the offset in the string and falls back to local time,
  // avoiding the UTC-midnight shift that would occur with Date.slice(0, 10).
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarMatch[]>();
    for (const m of filtered) {
      const day = DateTime.fromISO(m.date).toISODate()!;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(m);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function setTeam(team: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (team === "all") {
      params.delete("team");
    } else {
      params.set("team", team);
    }
    router.push(`/calendar${params.size ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }

  return (
    <div className="space-y-8">
      {/* Team filter */}
      {teams.length > 0 && (
        <FilterTabs
          tabs={[
            { value: "all", label: "Alle teams" },
            ...teams.map((team): FilterTab => ({ value: team, label: team })),
          ]}
          activeTab={activeTeam}
          onChange={setTeam}
          ariaLabel="Filter op team"
          showCounts={false}
        />
      )}

      {/* Matches grouped by date */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">Geen wedstrijden gevonden.</p>
        </div>
      ) : (
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
      )}

      {/* Scheurkalender link */}
      <div className="pt-4 border-t border-gray-200 flex justify-end">
        <Link
          href="/scheurkalender"
          className="text-sm text-gray-500 hover:text-green-main transition-colors"
        >
          Scheurkalender afdrukken →
        </Link>
      </div>
    </div>
  );
}
