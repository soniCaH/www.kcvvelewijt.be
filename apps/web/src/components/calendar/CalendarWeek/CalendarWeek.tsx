"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { MatchTeaser } from "@/components/match/MatchTeaser";
import {
  getDaysInWeek,
  getMatchesForDay,
  getEventsForDay,
} from "@/app/(main)/kalender/utils";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";

export interface CalendarWeekProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  weekStart: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const SHORT_DAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export function CalendarWeek({
  matches,
  events,
  weekStart,
  onPrevWeek,
  onNextWeek,
}: CalendarWeekProps) {
  const days = useMemo(() => getDaysInWeek(weekStart), [weekStart]);

  const firstDay = DateTime.fromISO(days[0]);
  const lastDay = DateTime.fromISO(days[6]);
  const sameMonth = firstDay.month === lastDay.month;

  const rangeLabel = sameMonth
    ? `${firstDay.day} - ${lastDay.day} ${firstDay.toLocaleString({ month: "long", year: "numeric" }, { locale: "nl-BE" })}`
    : `${firstDay.day} ${firstDay.toLocaleString({ month: "long" }, { locale: "nl-BE" })} - ${lastDay.day} ${lastDay.toLocaleString({ month: "long", year: "numeric" }, { locale: "nl-BE" })}`;

  return (
    <div>
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevWeek}
          aria-label="Vorige week"
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
          {rangeLabel}
        </span>
        <button
          onClick={onNextWeek}
          aria-label="Volgende week"
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

      {/* 7-day column grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const dt = DateTime.fromISO(day);
          const dayMatches = getMatchesForDay(matches, day);
          const dayEvents = getEventsForDay(events, day);

          return (
            <div key={day} data-testid={`week-col-${day}`} className="min-h-32">
              {/* Column header */}
              <div className="text-center text-sm font-semibold text-gray-600 pb-2 border-b border-gray-200 mb-2">
                {SHORT_DAYS[i]} {dt.day}
              </div>

              {/* Day content */}
              <div className="space-y-2">
                {dayMatches.map((match) => (
                  <div key={match.id} data-match>
                    <MatchTeaser
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
                      status={
                        match.status === "scheduled" ? "upcoming" : match.status
                      }
                      href={`/wedstrijd/${match.id}`}
                      teamLabel={match.team}
                      variant="compact"
                    />
                  </div>
                ))}
                {dayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="block bg-blue-50 border border-blue-200 rounded p-2 text-xs font-medium text-blue-800 hover:bg-blue-100 transition-colors"
                  >
                    {event.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
