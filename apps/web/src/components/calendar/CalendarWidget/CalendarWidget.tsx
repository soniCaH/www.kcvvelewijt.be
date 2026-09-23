"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { clubToday, toDisplayZone } from "@/lib/utils/dates";
import { trackEvent } from "@/lib/analytics/track-event";
import { useRouterFilterParam } from "@/hooks/useRouterFilterParam";
import { narrowParam } from "@/hooks/filterParam";
import {
  EmptyState,
  FilterTabs,
  type FilterTab,
} from "@/components/design-system";
import {
  filteredEmptyBody,
  pendingEmptyBody,
} from "@/lib/utils/empty-state-copy";
import {
  EVENT_TYPE_TABS,
  EVENT_TYPE_ORDER,
} from "@/components/event/event-type-style";
import { CalendarMonth } from "../CalendarMonth";
import { CalendarWeek } from "../CalendarWeek";
import { CalendarAgenda } from "../CalendarAgenda";
import { CalendarSubscribePanel } from "../CalendarSubscribePanel";
import {
  formatMonthNavLabel,
  formatWeekRangeLabel,
} from "@/app/(main)/kalender/utils";
import type {
  CalendarFeedItem,
  CalendarMatch,
  CalendarEvent,
  CalendarTeamInfo,
  KalenderFilterValue,
} from "@/app/(main)/kalender/utils";

/**
 * The by-type filter row (#1992, absorbed into `<FilterTabs>` by #2429/#2564
 * — replaces the deleted bespoke `KalenderFilterBar`). `EVENT_TYPE_TABS` +
 * `EVENT_TYPE_ORDER` are the shared source (`event-type-style.ts`, #2564
 * review item 1) also consumed by `/evenementen`'s `EventsBrowser` — one
 * definition of each event-type chip's colour, not two kept in sync by
 * hand. `Wedstrijden` (matches) is this row's own addition, carrying the
 * owner-locked `card-red` fill (#1992).
 */
const KALENDER_FILTER_TABS: FilterTab[] = [
  { value: "all", label: "Alles" },
  {
    value: "Wedstrijden",
    label: "Wedstrijden",
    color: { border: "border-card-red", fill: "bg-card-red text-cream" },
  },
  ...EVENT_TYPE_ORDER.map((type) => EVENT_TYPE_TABS[type]),
];

/** Every valid `?type=` value, in render order — the single source of truth
 *  `useRouterFilterParam` narrows the URL param against (an unknown value falls
 *  back to "all"). Derived from `KALENDER_FILTER_TABS` itself (#2564 review
 *  item 10) so a new chip can't be added to the row and forgotten here —
 *  the failure mode that shipped a chip whose own deep link silently fell
 *  back to "all". */
const KALENDER_FILTER_VALUES: readonly KalenderFilterValue[] =
  KALENDER_FILTER_TABS.map((tab) => tab.value as KalenderFilterValue);

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
    { value: "month", label: "Maand", mobileHidden: true },
    { value: "week", label: "Week", mobileHidden: true },
    { value: "agenda", label: "Agenda" },
  ];

/** `?view=` narrows to "week"/"agenda" only — "month" is both the fallback
 *  and the sentinel every other value (including an absent param) collapses
 *  to, via the same `narrowParam` (#2779) `useRouterFilterParam` uses for
 *  `?type=` below (#2783 review finding 9) — `?view=` itself stays off that
 *  hook: its default depends on runtime viewport state (`isPhone`), not a
 *  static fallback, and it always writes rather than deleting on default. */
const VIEW_VALUES: readonly ViewMode[] = ["week", "agenda"];

/**
 * `true` once mounted on a sub-`md` (phone) viewport. Starts `false` so the
 * server and the first client render agree on the desktop default (month); a
 * phone corrects to the agenda default after mount (mirrors the Week tab's
 * `hidden md:inline-flex`). `addEventListener` keeps it live across rotation.
 */
function useIsPhoneViewport(): boolean {
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isPhone;
}

export function CalendarWidget({ feed, teams, today }: CalendarWidgetProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // No explicit `?view=` → branch the default on the md breakpoint: agenda on
  // phones, month on tablet/desktop. An explicit choice (incl. tapping a tab,
  // which sets `?view=`) always wins.
  const rawView = searchParams.get("view");
  const isPhone = useIsPhoneViewport();
  const requestedView: ViewMode =
    rawView != null
      ? narrowParam(rawView, VIEW_VALUES, "month")
      : isPhone
        ? "agenda"
        : "month";
  // The week grid is forced 7-col (~41px cells) and `?view=week` pins it on any
  // viewport — coerce it to the agenda list on phones (MOB-6). The month tab is
  // hidden on phones too, but an explicit `?view=month` still wins (it can only
  // be reached deliberately).
  const view: ViewMode =
    isPhone && requestedView === "week" ? "agenda" : requestedView;

  // By-type filter (Phase 6.D Phase 2, #1992). An unknown `?type=` falls to
  // "all" — `useRouterFilterParam` (#2779) owns the narrow-or-fallback, the
  // delete-on-default write, and the dedup guard the old hand-rolled
  // `isKalenderFilterValue` + `setType` body used to.
  const [activeTypeFilter, setActiveTypeFilter] = useRouterFilterParam(
    "type",
    KALENDER_FILTER_VALUES,
    { fallback: "all", route: "/kalender" },
  );

  // One shared period anchor for all three views (6.D lock — switching Maand /
  // Week / Agenda keeps the navigated window). Month + Agenda page by month,
  // Week pages by week; both derive from this single cursor, seeded from
  // `today` defaults to the club's clock: the seed is evaluated once on the UTC
  // server and again in the visitor's zone at hydration, so an unpinned one can
  // open the widget on a different day than the grid rings as today.
  const seedDay = today ?? clubToday();
  const [cursor, setCursor] = useState<string>(seedDay);
  const [selectedDate, setSelectedDate] = useState(seedDay);
  const [subscribePanelOpen, setSubscribePanelOpen] = useState(false);

  const cursorDt = toDisplayZone(cursor);
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
    const next = toDisplayZone(cursor).plus(
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
    // push nor the `kalender_filter` analytics event fires twice (repo
    // policy) — `useRouterFilterParam`'s own internal dedup guard covers the URL
    // write, but the analytics call is this component's own side effect, so
    // it needs its own guard too.
    if (value === activeTypeFilter) return;
    setActiveTypeFilter(value);
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

  return (
    <div className="space-y-4">
      {/* By-type filter chips (the row doubles as the colour legend) */}
      <FilterTabs
        tabs={KALENDER_FILTER_TABS}
        activeTab={activeTypeFilter}
        onChange={(value) => setType(value as KalenderFilterValue)}
        showCounts={false}
        ariaLabel="Filter kalender op type"
      />

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
              className="border-ink bg-cream hover:bg-cream-soft flex h-11 w-11 items-center justify-center border-2 font-mono transition-colors"
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
              className="border-ink bg-cream hover:bg-cream-soft flex h-11 w-11 items-center justify-center border-2 font-mono transition-colors"
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
            // "all" + nothing = genuinely empty ("Nog geen" — a match or
            // event can still be scheduled); a specific facet + nothing =
            // the selection emptied the calendar (names the facet, carries
            // the mandatory undo via `reason="filtered"`, never "Nog geen"
            // — #2427 rule 5). Computed only here, not on every render
            // (round 3 review, D6). `surface="bare"`: already inside this
            // panel's own bordered/shadowed shell — a second frame here
            // nested two ink borders with a shadow between them.
            activeTypeFilter === "all" ? (
              <EmptyState
                tier="surface"
                heading="Nog geen wedstrijden of evenementen gepland"
                live
                surface="bare"
              >
                {pendingEmptyBody(
                  "er een wedstrijd of evenement gepland wordt",
                  "het",
                )}
              </EmptyState>
            ) : (
              <EmptyState
                tier="surface"
                heading={
                  activeTypeFilter === "Wedstrijden"
                    ? "Geen wedstrijden gepland"
                    : `Geen evenementen in de categorie ${activeTypeFilter}`
                }
                live
                surface="bare"
                reason="filtered"
                undo={{
                  label: "Toon alles",
                  onClick: () => setType("all"),
                  analyticsSource: "kalender",
                  analyticsFacet: activeTypeFilter,
                }}
              >
                {filteredEmptyBody("de volledige kalender")}
              </EmptyState>
            )
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
