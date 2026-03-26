"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { MatchTeaser } from "@/components/match/MatchTeaser";
import {
  getDaysInMonth,
  getMatchesForDay,
  getEventsForDay,
  getMatchDotType,
} from "@/app/(main)/kalender/utils";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";

export interface CalendarMonthProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentMonth: number;
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAY_HEADERS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function DayDots({
  day,
  matches,
  events,
}: {
  day: string;
  matches: CalendarMatch[];
  events: CalendarEvent[];
}) {
  const dayMatches = getMatchesForDay(matches, day);
  const dayEvents = getEventsForDay(events, day);

  const hasHome = dayMatches.some((m) => getMatchDotType(m) === "home");
  const hasAway = dayMatches.some((m) => getMatchDotType(m) === "away");
  const hasEvent = dayEvents.length > 0;

  if (!hasHome && !hasAway && !hasEvent) return null;

  return (
    <div className="flex gap-0.5 justify-center mt-0.5">
      {hasHome && (
        <span
          data-testid={`dot-home-${day}`}
          className="w-1.5 h-1.5 rounded-full bg-kcvv-green-bright"
        />
      )}
      {hasAway && (
        <span
          data-testid={`dot-away-${day}`}
          className="w-1.5 h-1.5 rounded-full border border-kcvv-green-bright"
        />
      )}
      {hasEvent && (
        <span
          data-testid={`dot-event-${day}`}
          className="w-1.5 h-1.5 rounded-full bg-blue-500"
        />
      )}
    </div>
  );
}

function DayPanel({
  date,
  matches,
  events,
}: {
  date: string;
  matches: CalendarMatch[];
  events: CalendarEvent[];
}) {
  const dayMatches = getMatchesForDay(matches, date);
  const dayEvents = getEventsForDay(events, date);
  const formatted = DateTime.fromISO(date).toLocaleString(
    { weekday: "long", day: "numeric", month: "long" },
    { locale: "nl-BE" },
  );

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300">
      <h3
        data-testid="day-panel-heading"
        className="text-lg font-semibold text-gray-800 mb-4 capitalize"
      >
        {formatted}
      </h3>

      {dayMatches.length === 0 && dayEvents.length === 0 ? (
        <p className="text-gray-500">
          Geen wedstrijden of activiteiten op deze dag.
        </p>
      ) : (
        <div className="space-y-3">
          {dayMatches.map((match) => (
            <MatchTeaser
              key={match.id}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              date={match.date}
              time={match.time}
              score={
                match.scoreDisplay.type === "score"
                  ? {
                      home: match.scoreDisplay.home,
                      away: match.scoreDisplay.away,
                    }
                  : undefined
              }
              status={match.status === "scheduled" ? "upcoming" : match.status}
              href={`/wedstrijd/${match.id}`}
              teamLabel={match.team}
              variant="compact"
            />
          ))}
          {dayEvents.map((event) => (
            <Link
              key={event.id}
              href={event.href}
              className="block bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors"
            >
              <span className="text-sm font-medium text-blue-800">
                {event.title}
              </span>
            </Link>
          ))}
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
  onPrevMonth,
  onNextMonth,
}: CalendarMonthProps) {
  const days = useMemo(
    () => getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const today = DateTime.now().toISODate()!;
  const monthLabel = DateTime.local(
    currentYear,
    currentMonth,
    1,
  ).toLocaleString({ month: "long", year: "numeric" }, { locale: "nl-BE" });

  return (
    <div>
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          aria-label="Vorige maand"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-lg font-semibold text-gray-800">
          {monthLabel}
        </span>
        <button
          onClick={onNextMonth}
          aria-label="Volgende maand"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((h) => (
          <div
            key={h}
            className="text-center text-xs font-semibold text-gray-500 py-2"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7" data-testid="month-grid">
        {days.map((day) => {
          const dt = DateTime.fromISO(day);
          const isCurrentMonth = dt.month === currentMonth;
          const isToday = day === today;
          const isSelected = day === selectedDate;

          return (
            <button
              key={day}
              onClick={() => onSelectDate(day)}
              aria-label={dt.toLocaleString(
                { day: "numeric", month: "long" },
                { locale: "nl-BE" },
              )}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded-lg text-sm transition-colors",
                !isCurrentMonth && "text-gray-300",
                isCurrentMonth && !isSelected && !isToday && "text-gray-700",
                isToday && !isSelected && "bg-gray-100 font-semibold",
                isSelected && "bg-kcvv-green-bright text-white font-semibold",
              )}
            >
              <span>{dt.day}</span>
              <DayDots day={day} matches={matches} events={events} />
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      <DayPanel date={selectedDate} matches={matches} events={events} />
    </div>
  );
}
