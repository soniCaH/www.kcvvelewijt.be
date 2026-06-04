"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils/cn";
import { trackEvent } from "@/lib/analytics/track-event";
import { CalendarMonth } from "../CalendarMonth";
import { CalendarWeek } from "../CalendarWeek";
import { CalendarSubscribePanel } from "../CalendarSubscribePanel";
import {
  KalenderFilterBar,
  isKalenderFilterValue,
  type KalenderFilterValue,
} from "../KalenderFilterBar";
import type {
  CalendarFeedItem,
  CalendarMatch,
  CalendarEvent,
  CalendarTeamInfo,
} from "@/app/(main)/kalender/utils";

export interface CalendarWidgetProps {
  /**
   * Unified, chronologically-sorted calendar feed — PSD matches + the 6.E event
   * feed (`event` docs + `articleType:event` articles), composed by
   * `buildCalendarFeed`. The widget filters this by `kalenderType` and projects
   * it back to the match/event arrays the month/week renderers consume.
   */
  feed: CalendarFeedItem[];
  teams: CalendarTeamInfo[];
}

type ViewMode = "month" | "week";

const VIEW_TABS: { value: ViewMode; label: string; mobileHidden?: boolean }[] =
  [
    { value: "month", label: "Maand" },
    { value: "week", label: "Week", mobileHidden: true },
  ];

export function CalendarWidget({ feed, teams }: CalendarWidgetProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawView = searchParams.get("view");
  const view: ViewMode = rawView === "week" ? "week" : "month";

  // By-type filter (Phase 6.D Phase 2, #1992) — replaces the legacy by-team
  // filter. An unknown `?type=` value falls back to "all".
  const rawType = searchParams.get("type");
  const activeTypeFilter: KalenderFilterValue = isKalenderFilterValue(rawType)
    ? rawType
    : "all";

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

  function setType(value: KalenderFilterValue) {
    // Dedup guard: re-pressing the active chip is a no-op, so neither the URL
    // push nor the `kalender_filter` analytics event fires twice for the same
    // selection (repo analytics policy).
    if (value === activeTypeFilter) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    router.push(`/kalender${params.size ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
    trackEvent("kalender_filter", { kalender_type: value });
  }

  // Narrow the unified feed to the active type, then project the survivors back
  // to the match/event arrays the month/week renderers already consume.
  const filteredFeed =
    activeTypeFilter === "all"
      ? feed
      : feed.filter((item) => item.kalenderType === activeTypeFilter);
  const matches: CalendarMatch[] = filteredFeed.flatMap((item) =>
    item.source === "match" ? [item.match] : [],
  );
  const events: CalendarEvent[] = filteredFeed.flatMap((item) =>
    item.source !== "match" ? [item.event] : [],
  );

  // Empty + filtered-to-zero copy — both render a message instead of a blank
  // grid. "all" + nothing = genuinely empty; a specific facet + nothing = the
  // selection emptied the calendar.
  const zeroMessage =
    activeTypeFilter === "all"
      ? "Geen wedstrijden of evenementen gepland."
      : activeTypeFilter === "Wedstrijden"
        ? "Geen wedstrijden gepland."
        : `Geen evenementen in de categorie ${activeTypeFilter} gepland.`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {/* View tabs — segmented control */}
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-300">
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
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            subscribePanelOpen
              ? "border-gray-400 bg-gray-50 text-gray-900"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
          )}
        >
          Abonneer
          <svg
            className={cn(
              "h-4 w-4 transition-transform",
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

      {/* Subscribe panel — a team-match feed, orthogonal to the type filter */}
      <CalendarSubscribePanel teams={teams} isOpen={subscribePanelOpen} />

      {/* By-type filter chips (the row doubles as the colour legend) */}
      <KalenderFilterBar selected={activeTypeFilter} onSelect={setType} />

      {filteredFeed.length === 0 ? (
        // role="status" (implicit aria-live="polite") so the message is
        // announced when a filter selection empties the calendar — it appears
        // on a client-side state change, not a page load.
        <div
          role="status"
          className="flex flex-col items-center gap-3 py-12 text-center text-gray-600"
        >
          <p className="font-medium">{zeroMessage}</p>
          {activeTypeFilter !== "all" && (
            <button
              type="button"
              onClick={() => setType("all")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Toon alles
            </button>
          )}
        </div>
      ) : (
        <>
          {view === "month" && (
            <CalendarMonth
              matches={matches}
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
              matches={matches}
              events={events}
              weekStart={weekStart}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
            />
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-gray-200 pt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="bg-kcvv-green-bright h-2 w-2 rounded-full" />
              <span>Thuiswedstrijd</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="border-kcvv-green-bright h-2 w-2 rounded-full border" />
              <span>Uitwedstrijd</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Evenement</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
