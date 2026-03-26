"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils/cn";
import { FilterTabs, type FilterTab } from "@/components/design-system";
import { CalendarMonth } from "../CalendarMonth";
import { CalendarWeek } from "../CalendarWeek";
import { CalendarSubscribePanel } from "../CalendarSubscribePanel";
import type {
  CalendarMatch,
  CalendarEvent,
  CalendarTeamInfo,
} from "@/app/(main)/kalender/utils";

export interface CalendarWidgetProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  teams: CalendarTeamInfo[];
}

type ViewMode = "month" | "week";

const VIEW_TABS: { value: ViewMode; label: string; mobileHidden?: boolean }[] =
  [
    { value: "month", label: "Maand" },
    { value: "week", label: "Week", mobileHidden: true },
  ];

export function CalendarWidget({
  matches,
  events,
  teams,
}: CalendarWidgetProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawView = searchParams.get("view");
  const view: ViewMode = rawView === "week" ? "week" : "month";
  const activeTeamFilter = searchParams.get("team") ?? "all";

  const today = DateTime.now();
  const [selectedDate, setSelectedDate] = useState(today.toISODate()!);
  const [currentMonth, setCurrentMonth] = useState<number>(today.month);
  const [currentYear, setCurrentYear] = useState(today.year);
  const [weekStart, setWeekStart] = useState(
    today.startOf("week").toISODate()!,
  );
  const [subscribePanelOpen, setSubscribePanelOpen] = useState(false);

  function setView(newView: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`/kalender?${params.toString()}`, { scroll: false });
  }

  function handlePrevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handlePrevWeek() {
    setWeekStart((ws) => DateTime.fromISO(ws).minus({ weeks: 1 }).toISODate()!);
  }

  function handleNextWeek() {
    setWeekStart((ws) => DateTime.fromISO(ws).plus({ weeks: 1 }).toISODate()!);
  }

  // Derive team tabs from match data
  const teamLabels: string[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    if (m.team && !seen.has(m.team)) {
      seen.add(m.team);
      teamLabels.push(m.team);
    }
  }
  // Sort: seniors first (A, B), then youth by age descending (U21, U17, U15, ...)
  // When same age group, sort by label (which includes team ID like "U15 A", "U15 B")
  teamLabels.sort((a, b) => {
    const ageOf = (label: string): number => {
      const m = label.match(/U(\d+)/i);
      return m ? parseInt(m[1], 10) : Infinity; // seniors = Infinity → sort first
    };
    const seniorOrder = ["A-ploeg", "B-ploeg"];
    const sa = seniorOrder.indexOf(a);
    const sb = seniorOrder.indexOf(b);
    // Both senior → preserve A before B
    if (sa !== -1 && sb !== -1) return sa - sb;
    // One senior → senior first
    if (sa !== -1) return -1;
    if (sb !== -1) return 1;
    // Both youth → higher age first (U21 > U17 > U15 > ...)
    const ageDiff = ageOf(b) - ageOf(a);
    return ageDiff !== 0 ? ageDiff : a.localeCompare(b);
  });

  function setTeam(team: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (team === "all") {
      params.delete("team");
    } else {
      params.set("team", team);
    }
    router.push(`/kalender${params.size ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }

  // Filter matches by active team filter
  const filteredMatches =
    activeTeamFilter === "all"
      ? matches
      : matches.filter((m) => m.team === activeTeamFilter);

  const preselectedTeamLabel =
    activeTeamFilter !== "all" ? activeTeamFilter : undefined;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {/* View tabs — segmented control */}
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setView(tab.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                tab.mobileHidden && "hidden md:inline-flex",
                view === tab.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subscribe button */}
        <button
          onClick={() => setSubscribePanelOpen((prev) => !prev)}
          aria-expanded={subscribePanelOpen}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border",
            subscribePanelOpen
              ? "bg-gray-50 border-gray-400 text-gray-900"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
          )}
        >
          Abonneer
          <svg
            className={cn(
              "w-4 h-4 transition-transform",
              subscribePanelOpen && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Subscribe panel */}
      <CalendarSubscribePanel
        teams={teams}
        preselectedTeamLabel={preselectedTeamLabel}
        isOpen={subscribePanelOpen}
      />

      {/* Team filter */}
      {teamLabels.length > 0 && (
        <FilterTabs
          tabs={[
            { value: "all", label: "Alle teams" } as FilterTab,
            ...teamLabels.map(
              (team): FilterTab => ({ value: team, label: team }),
            ),
          ]}
          activeTab={activeTeamFilter}
          onChange={setTeam}
          ariaLabel="Filter op team"
          showCounts={false}
        />
      )}

      {/* View content */}
      {view === "month" && (
        <CalendarMonth
          matches={filteredMatches}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      )}

      {view === "week" && (
        <CalendarWeek
          matches={filteredMatches}
          events={events}
          weekStart={weekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-kcvv-green-bright" />
          <span>Thuiswedstrijd</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-kcvv-green-bright" />
          <span>Uitwedstrijd</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Evenement</span>
        </div>
      </div>
    </div>
  );
}
