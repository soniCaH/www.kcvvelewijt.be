"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils/cn";
import { FilterTabs, type FilterTab } from "@/components/design-system";
import { CalendarMonth } from "../CalendarMonth";
import { CalendarWeek } from "../CalendarWeek";
import { CalendarSubscribePanel } from "../CalendarSubscribePanel";
import { CalendarListView } from "./CalendarListView";
import type {
  CalendarMatch,
  CalendarEvent,
  CalendarTeamInfo,
} from "@/app/(main)/kalender/utils";

export interface CalendarWidgetProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  teams: CalendarTeamInfo[];
  activeTeamFilter: string;
}

type ViewMode = "month" | "week" | "list";

const VIEW_TABS: { value: ViewMode; label: string; mobileHidden?: boolean }[] =
  [
    { value: "month", label: "Maand" },
    { value: "week", label: "Week", mobileHidden: true },
    { value: "list", label: "Lijst" },
  ];

export function CalendarWidget({
  matches,
  events,
  teams,
  activeTeamFilter,
}: CalendarWidgetProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = (searchParams.get("view") as ViewMode) ?? "month";

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
  teamLabels.sort((a, b) => {
    const order = ["A-ploeg", "B-ploeg"];
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
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
        {/* View tabs */}
        <div className="flex gap-1">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setView(tab.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                tab.mobileHidden && "hidden md:inline-flex",
                view === tab.value
                  ? "bg-kcvv-green-bright text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subscribe button */}
        <button
          onClick={() => setSubscribePanelOpen((prev) => !prev)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            subscribePanelOpen
              ? "bg-kcvv-green-bright text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
          )}
        >
          <span aria-hidden="true">📅</span>
          Abonneer
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

      {view === "list" && <CalendarListView matches={filteredMatches} />}
    </div>
  );
}
