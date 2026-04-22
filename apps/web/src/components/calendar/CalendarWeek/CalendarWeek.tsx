"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { MatchStatusBadge } from "@/components/match/MatchStatusBadge";
import {
  getDaysInWeek,
  getMatchesForDay,
  getEventsForDay,
  getMatchDotType,
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
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevWeek}
          aria-label="Vorige week"
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <svg
            className="h-5 w-5"
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
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <svg
            className="h-5 w-5"
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
              <div className="mb-2 border-b border-gray-200 pb-2 text-center text-sm font-semibold text-gray-600">
                {SHORT_DAYS[i]} {dt.day}
              </div>

              {/* Day content */}
              <div className="space-y-1.5">
                {dayMatches.map((match) => {
                  const isHome = getMatchDotType(match) === "home";
                  const opponent = isHome ? match.awayTeam : match.homeTeam;
                  const hasDetail = match.status !== "scheduled";
                  const cardClass = cn(
                    "block rounded border border-gray-200 bg-white p-1.5 transition-all",
                    hasDetail &&
                      "hover:border-kcvv-green-bright hover:shadow-sm",
                  );
                  const cardContent = (
                    <>
                      {/* Team label */}
                      {match.team && (
                        <div className="text-kcvv-green-bright mb-0.5 truncate text-[9px] font-bold tracking-wider uppercase">
                          {match.team}
                        </div>
                      )}
                      {/* Opponent + dot */}
                      <div
                        className="flex items-center gap-1"
                        title={opponent.name}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            isHome
                              ? "bg-kcvv-green-bright"
                              : "border-kcvv-green-bright border",
                          )}
                        />
                        <span className="truncate text-xs font-medium text-gray-700">
                          {opponent.name}
                        </span>
                      </div>
                      {/* Time + status */}
                      <div className="mt-0.5 flex items-center gap-1">
                        {match.time && (
                          <span className="text-[10px] font-medium text-gray-400">
                            {match.time}
                          </span>
                        )}
                        {match.scoreDisplay.type === "score" && (
                          <span className="text-[10px] font-bold text-gray-600 tabular-nums">
                            {match.scoreDisplay.home}-{match.scoreDisplay.away}
                          </span>
                        )}
                        {match.status !== "scheduled" &&
                          match.status !== "finished" && (
                            <MatchStatusBadge status={match.status} />
                          )}
                      </div>
                    </>
                  );
                  return hasDetail ? (
                    <Link
                      key={match.id}
                      href={`/wedstrijd/${match.id}`}
                      data-match
                      className={cardClass}
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <div key={match.id} data-match className={cardClass}>
                      {cardContent}
                    </div>
                  );
                })}
                {dayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="block truncate rounded border border-blue-200 bg-blue-50 p-1.5 text-[10px] font-medium text-blue-800 transition-colors hover:bg-blue-100"
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
