"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { TeamAgendaRow } from "@/components/team/TeamMatchesSection/TeamAgendaRow";
import { EVENT_TYPE_FILL } from "@/components/event/event-type-style";
import { EventTypeTag } from "../calendar-tags";
import { trackKalenderItemClick } from "../calendar-analytics";
import {
  getDaysInMonth,
  getMatchDotType,
  calendarMatchToScheduleMatch,
  formatDayDetailHeading,
  formatItemCount,
  formatEventTime,
  groupFeedByDay,
  EMPTY_DAY_FEED,
} from "@/app/(main)/kalender/utils";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";

export interface CalendarMonthProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentMonth: number;
  currentYear: number;
}

const DAY_HEADERS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

/**
 * Dense-day cell body (6.D lock / 6d3-v2): events first as full-width italic
 * display titles + a type-colour dot (rare + high-value, never hidden), then a
 * row of match pips below — `card-red` filled = thuis, `card-red` ring = uit.
 * No count badge; the pip row is the volume signal.
 */
function DayCellBody({
  day,
  dayMatches,
  dayEvents,
}: {
  day: string;
  dayMatches: CalendarMatch[];
  dayEvents: CalendarEvent[];
}) {
  if (dayMatches.length === 0 && dayEvents.length === 0) return null;

  return (
    <div className="mt-1 w-full space-y-1">
      {dayEvents.length > 0 && (
        <div data-testid={`day-events-${day}`} className="space-y-0.5">
          {dayEvents.map((event) => (
            <div
              key={event.id}
              data-testid="cell-event"
              className="flex items-start gap-1 text-left"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1 h-[7px] w-[7px] shrink-0 rounded-full",
                  EVENT_TYPE_FILL[event.eventType],
                )}
              />
              <span className="font-display text-ink line-clamp-2 text-[11px] leading-tight font-bold italic">
                {event.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {dayMatches.length > 0 && (
        <div
          data-testid={`day-pips-${day}`}
          className="flex flex-wrap gap-[3px]"
        >
          {dayMatches.map((match) => {
            const venue = getMatchDotType(match);
            return (
              <span
                key={match.id}
                data-testid="match-pip"
                data-venue={venue}
                className={cn(
                  "h-2 w-2 rounded-full",
                  venue === "home"
                    ? "bg-card-red"
                    : "border-card-red border-[1.5px] bg-transparent",
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Selected-day detail below the grid. Matches reuse the 6.C `<TeamAgendaRow>`
 * scoreboard (time · crests · KCVV-team label · thuis/uit · outcome colour),
 * stub omitted since the day is already the heading; events render as a
 * type-tagged title row linking to their detail route.
 */
function SelectedDayDetail({
  date,
  dayMatches,
  dayEvents,
}: {
  date: string;
  dayMatches: CalendarMatch[];
  dayEvents: CalendarEvent[];
}) {
  const heading = formatDayDetailHeading(date);
  const caption = formatItemCount(dayMatches.length, dayEvents.length);

  return (
    <div className="border-ink mt-6 border-t-2 pt-5">
      <h3
        data-testid="day-panel-heading"
        className="font-display text-ink mb-4 text-xl leading-none font-black"
      >
        {heading}
        {caption && (
          <span className="text-ink-muted ml-2 font-mono text-xs font-normal tracking-wide">
            · {caption}
          </span>
        )}
      </h3>

      {dayMatches.length === 0 && dayEvents.length === 0 ? (
        <p className="text-ink-muted font-mono text-sm">
          Geen wedstrijden of activiteiten op deze dag.
        </p>
      ) : (
        <div className="space-y-2">
          {dayMatches.map((match) => (
            <TeamAgendaRow
              key={match.id}
              match={calendarMatchToScheduleMatch(match)}
              showDateStub={false}
              onNavigate={() => trackKalenderItemClick("match")}
            />
          ))}
          {dayEvents.map((event) => {
            const time = formatEventTime(event.dateStart);
            return (
              <Link
                key={event.id}
                href={event.href}
                data-testid="day-event-row"
                onClick={() => trackKalenderItemClick(event.source)}
                className={cn(
                  "border-ink bg-cream text-ink shadow-[2px_2px_0_0_var(--color-ink)]",
                  "flex items-center gap-3 border-2 px-3 py-2 no-underline transition-all duration-300",
                  "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
                  "focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
              >
                {time && (
                  <span className="text-ink-muted shrink-0 font-mono text-xs">
                    {time}
                  </span>
                )}
                <span className="font-display min-w-0 flex-1 truncate text-base font-bold italic">
                  {event.title}
                </span>
                <EventTypeTag eventType={event.eventType} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CalendarMonth({
  matches,
  events,
  selectedDate,
  onSelectDate,
  currentMonth,
  currentYear,
}: CalendarMonthProps) {
  const days = useMemo(
    () => getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // Bucket the feed once per feed change instead of filtering the full arrays
  // per cell (×35–42) and again for the detail — a map lookup per day.
  const byDay = useMemo(
    () => groupFeedByDay(matches, events),
    [matches, events],
  );
  const selected = byDay.get(selectedDate) ?? EMPTY_DAY_FEED;

  const today = DateTime.now().toISODate()!;

  return (
    <div>
      {/* Day headers */}
      <div className="border-paper-edge mb-1 grid grid-cols-7 border-b border-dashed">
        {DAY_HEADERS.map((h) => (
          <div
            key={h}
            className="text-ink-muted py-2 text-center font-mono text-[10px] font-semibold tracking-wider uppercase"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        className="border-ink grid grid-cols-7 border-2"
        data-testid="month-grid"
      >
        {days.map((day) => {
          const dt = DateTime.fromISO(day);
          const isCurrentMonth = dt.month === currentMonth;
          const isToday = day === today;
          const isSelected = day === selectedDate;
          const feed = byDay.get(day) ?? EMPTY_DAY_FEED;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(day)}
              aria-label={dt.toLocaleString(
                { day: "numeric", month: "long" },
                { locale: "nl-BE" },
              )}
              aria-pressed={isSelected}
              className={cn(
                "border-paper-edge flex min-h-[108px] flex-col items-stretch border-r border-b border-dashed p-1.5 text-left transition-colors last:border-r-0",
                "[&:nth-child(7n)]:border-r-0",
                "focus-visible:outline-jersey-deep focus-visible:outline-2 focus-visible:-outline-offset-2",
                isSelected
                  ? "bg-jersey-deep/12 outline-jersey-deep outline-2 -outline-offset-2"
                  : "hover:bg-cream-soft/60",
              )}
            >
              <span
                className={cn(
                  "font-mono text-[11px]",
                  !isCurrentMonth && "text-ink-muted/40",
                  isCurrentMonth && !isToday && "text-ink-muted",
                  isToday && "text-ink font-bold",
                )}
              >
                {dt.day}
              </span>
              <DayCellBody
                day={day}
                dayMatches={feed.matches}
                dayEvents={feed.events}
              />
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      <SelectedDayDetail
        date={selectedDate}
        dayMatches={selected.matches}
        dayEvents={selected.events}
      />
    </div>
  );
}
