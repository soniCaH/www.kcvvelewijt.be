"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils/cn";
import { trackEvent } from "@/lib/analytics/track-event";
import { CalendarMonth } from "../CalendarMonth";
import { CalendarWeek } from "../CalendarWeek";
import { CalendarAgenda } from "../CalendarAgenda";
import { CalendarSubscribePanel } from "../CalendarSubscribePanel";
import {
  KalenderFilterBar,
  isKalenderFilterValue,
  type KalenderFilterValue,
} from "../KalenderFilterBar";
import {
  formatMonthNavLabel,
  formatWeekRangeLabel,
} from "@/app/(main)/kalender/utils";
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
   * it back to the match/event arrays the month/week/agenda renderers consume.
   */
  feed: CalendarFeedItem[];
  teams: CalendarTeamInfo[];
  /**
   * ISO date (`YYYY-MM-DD`) that seeds the initial navigated period + selected
   * day. Defaults to the real "today". Injected by stories/tests so the opening
   * window is deterministic regardless of the render clock (the grid's own
   * "today" highlight still follows the real clock).
   */
  today?: string;
}

type ViewMode = "month" | "week" | "agenda";

const VIEW_TABS: { value: ViewMode; label: string; mobileHidden?: boolean }[] =
  [
    { value: "month", label: "Maand" },
    { value: "week", label: "Week", mobileHidden: true },
    { value: "agenda", label: "Agenda" },
  ];

function parseView(raw: string | null): ViewMode {
  return raw === "week" || raw === "agenda" ? raw : "month";
}

export function CalendarWidget({ feed, teams, today }: CalendarWidgetProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = parseView(searchParams.get("view"));

  // By-type filter (Phase 6.D Phase 2, #1992). An unknown `?type=` falls to "all".
  const rawType = searchParams.get("type");
  const activeTypeFilter: KalenderFilterValue = isKalenderFilterValue(rawType)
    ? rawType
    : "all";

  // One shared period anchor for all three views (6.D lock — switching Maand /
  // Week / Agenda keeps the navigated window). Month + Agenda page by month,
  // Week pages by week; both derive from this single cursor, seeded from
  // `today` (defaults to the real clock).
  const seedDay = today ?? DateTime.now().toISODate()!;
  const [cursor, setCursor] = useState<string>(seedDay);
  const [selectedDate, setSelectedDate] = useState(seedDay);
  const [subscribePanelOpen, setSubscribePanelOpen] = useState(false);

  const cursorDt = DateTime.fromISO(cursor);
  const currentMonth = cursorDt.month;
  const currentYear = cursorDt.year;
  const weekStart = cursorDt.startOf("week").toISODate()!;

  const periodLabel =
    view === "week"
      ? formatWeekRangeLabel(weekStart)
      : formatMonthNavLabel(currentYear, currentMonth);

  function setView(newView: ViewMode) {
    // Dedup guard (repo analytics policy): re-selecting the active view is a
    // no-op, so neither the URL push nor `kalender_view_toggle` fires twice.
    if (newView === view) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`/kalender?${params.toString()}`, { scroll: false });
    trackEvent("kalender_view_toggle", { view: newView });
  }

  function stepPeriod(direction: 1 | -1) {
    const next = DateTime.fromISO(cursor).plus(
      view === "week" ? { weeks: direction } : { months: direction },
    );
    setCursor(next.toISODate()!);
    // Keep the grid's selected day inside the navigated month so the
    // selected-day detail never shows a day outside the visible grid after
    // paging (week stepping leaves the detail's day alone — it isn't rendered
    // in week view).
    if (view !== "week") {
      setSelectedDate(next.startOf("month").toISODate()!);
    }
  }

  const handlePrev = () => stepPeriod(-1);
  const handleNext = () => stepPeriod(1);

  function toggleSubscribe() {
    const next = !subscribePanelOpen;
    setSubscribePanelOpen(next);
    // Fire only on open (the panel revealing), not on collapse.
    if (next) trackEvent("kalender_subscribe_open");
  }

  function setType(value: KalenderFilterValue) {
    // Dedup guard: re-pressing the active chip is a no-op, so neither the URL
    // push nor the `kalender_filter` analytics event fires twice (repo policy).
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

  // Narrow the unified feed to the active type, then partition the survivors
  // back into the match/event arrays the renderers consume — in one pass, and
  // memoized so day-selection / view-toggle re-renders don't re-derive (and the
  // children's per-day grouping memos keep their references).
  const { filteredFeed, matches, events } = useMemo(() => {
    const filtered =
      activeTypeFilter === "all"
        ? feed
        : feed.filter((item) => item.kalenderType === activeTypeFilter);
    const matchList: CalendarMatch[] = [];
    const eventList: CalendarEvent[] = [];
    for (const item of filtered) {
      if (item.source === "match") matchList.push(item.match);
      else eventList.push(item.event);
    }
    return { filteredFeed: filtered, matches: matchList, events: eventList };
  }, [feed, activeTypeFilter]);

  // Empty + filtered-to-zero copy. "all" + nothing = genuinely empty; a specific
  // facet + nothing = the selection emptied the calendar.
  const zeroMessage =
    activeTypeFilter === "all"
      ? "Geen wedstrijden of evenementen gepland."
      : activeTypeFilter === "Wedstrijden"
        ? "Geen wedstrijden gepland."
        : `Geen evenementen in de categorie ${activeTypeFilter} gepland.`;

  return (
    <div className="space-y-4">
      {/* By-type filter chips (the row doubles as the colour legend) */}
      <KalenderFilterBar selected={activeTypeFilter} onSelect={setType} />

      {/* Paper/ink panel shell */}
      <div className="border-ink bg-cream shadow-paper-md border-2">
        {/* Toolbar: view toggle · shared period nav · subscribe */}
        <div className="border-ink flex flex-wrap items-center justify-between gap-3 border-b-2 p-3">
          {/* 3-way segmented control */}
          <div className="border-ink inline-flex overflow-hidden border-2">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                aria-pressed={view === tab.value}
                className={cn(
                  "border-ink px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors not-last:border-r-2",
                  tab.mobileHidden && "hidden md:inline-flex",
                  view === tab.value
                    ? "bg-ink text-cream"
                    : "text-ink hover:bg-cream-soft",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Shared period nav */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label={view === "week" ? "Vorige week" : "Vorige maand"}
              className="border-ink bg-cream hover:bg-cream-soft flex h-8 w-8 items-center justify-center border-2 font-mono transition-colors"
            >
              ‹
            </button>
            <span
              data-testid="period-label"
              className="font-display text-ink min-w-[8.5rem] text-center text-lg font-black"
            >
              {periodLabel}
            </span>
            <button
              type="button"
              onClick={handleNext}
              aria-label={view === "week" ? "Volgende week" : "Volgende maand"}
              className="border-ink bg-cream hover:bg-cream-soft flex h-8 w-8 items-center justify-center border-2 font-mono transition-colors"
            >
              ›
            </button>
          </div>

          {/* Subscribe toggle */}
          <button
            type="button"
            onClick={toggleSubscribe}
            aria-expanded={subscribePanelOpen}
            className={cn(
              "border-ink inline-flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-[11px] tracking-wide uppercase transition-colors",
              subscribePanelOpen
                ? "bg-ink text-cream"
                : "text-ink hover:bg-cream-soft",
            )}
          >
            ⤓ Abonneer
          </button>
        </div>

        {/* Subscribe panel — a team-match feed, orthogonal to the type filter */}
        <CalendarSubscribePanel teams={teams} isOpen={subscribePanelOpen} />

        {/* View content */}
        <div className="p-4">
          {filteredFeed.length === 0 ? (
            // role="status" so the message is announced when a filter selection
            // empties the calendar (a client-side state change, not a page load).
            <div
              role="status"
              className="text-ink-muted flex flex-col items-center gap-3 py-12 text-center"
            >
              <p className="font-mono font-medium">{zeroMessage}</p>
              {activeTypeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setType("all")}
                  className="border-ink bg-cream text-ink hover:bg-cream-soft border-2 px-4 py-2 font-mono text-sm font-medium transition-colors"
                >
                  Toon alles
                </button>
              )}
            </div>
          ) : view === "month" ? (
            <CalendarMonth
              matches={matches}
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          ) : view === "week" ? (
            <CalendarWeek
              matches={matches}
              events={events}
              weekStart={weekStart}
            />
          ) : (
            <CalendarAgenda
              matches={matches}
              events={events}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          )}
        </div>
      </div>
    </div>
  );
}
