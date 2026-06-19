"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { MatchStatusBadge } from "@/components/match/MatchStatusBadge";
import { EVENT_TYPE_FILL } from "@/components/event/event-type-style";
import { trackKalenderItemClick } from "../calendar-analytics";
import {
  getDaysInWeek,
  getMatchDotType,
  formatEventTime,
  groupFeedByDay,
  EMPTY_DAY_FEED,
} from "@/app/(main)/kalender/utils";
import type { CalendarMatch, CalendarEvent } from "@/app/(main)/kalender/utils";

export interface CalendarWeekProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  weekStart: string;
}

const SHORT_DAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function WeekMatchCard({ match }: { match: CalendarMatch }) {
  const isHome = getMatchDotType(match) === "home";
  const opponent = isHome ? match.awayTeam : match.homeTeam;

  const body = (
    <>
      {match.team && (
        <div className="text-ink-muted mb-0.5 truncate font-mono text-[9px] font-semibold tracking-wider uppercase">
          {match.team}
        </div>
      )}
      <div className="flex items-center gap-1" title={opponent.name}>
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            isHome
              ? "bg-card-red"
              : "border-card-red border-[1.5px] bg-transparent",
          )}
        />
        <span className="text-ink truncate text-xs font-medium">
          {opponent.name}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1">
        {match.time && (
          <span className="text-ink-muted font-mono text-[10px]">
            {match.time}
          </span>
        )}
        {match.scoreDisplay.type === "score" && (
          <span className="text-ink font-display text-[11px] font-bold tabular-nums">
            {match.scoreDisplay.home}-{match.scoreDisplay.away}
          </span>
        )}
        {match.status !== "scheduled" && match.status !== "finished" && (
          <MatchStatusBadge status={match.status} />
        )}
      </div>
    </>
  );

  // Every match links to its detail page — scheduled matches render a
  // VOORBESCHOUWING preview there (matching CalendarAgenda / CalendarMonth /
  // the homepage UpcomingMatches, which all link unconditionally). Same raised
  // paper press-down card as the event tile so the two read as one system.
  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      data-match
      onClick={() => trackKalenderItemClick("match")}
      className="border-ink bg-cream shadow-paper-sm block border-2 p-1.5 transition-all duration-300 hover:shadow-none motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1"
    >
      {body}
    </Link>
  );
}

export function CalendarWeek({
  matches,
  events,
  weekStart,
}: CalendarWeekProps) {
  const days = useMemo(() => getDaysInWeek(weekStart), [weekStart]);
  const byDay = useMemo(
    () => groupFeedByDay(matches, events),
    [matches, events],
  );
  const today = DateTime.now().toISODate()!;

  return (
    <div
      className="border-ink grid grid-cols-7 border-2"
      data-testid="week-grid"
    >
      {days.map((day, i) => {
        const dt = DateTime.fromISO(day);
        const { matches: dayMatches, events: dayEvents } =
          byDay.get(day) ?? EMPTY_DAY_FEED;
        const isToday = day === today;

        return (
          <div
            key={day}
            data-testid={`week-col-${day}`}
            className="border-paper-edge min-h-32 border-r border-dashed last:border-r-0 [&:nth-child(7n)]:border-r-0"
          >
            {/* Column header */}
            <div
              className={cn(
                "border-paper-edge border-b border-dashed py-2 text-center font-mono text-[11px] font-semibold tracking-wide uppercase",
                isToday ? "text-ink" : "text-ink-muted",
              )}
            >
              {SHORT_DAYS[i]} {dt.day}
            </div>

            {/* Day content */}
            <div className="space-y-1 p-1">
              {dayMatches.map((match) => (
                <WeekMatchCard key={match.id} match={match} />
              ))}
              {dayEvents.map((event) => {
                const time = formatEventTime(event.dateStart);
                return (
                  <Link
                    key={event.id}
                    href={event.href}
                    onClick={() => trackKalenderItemClick(event.source)}
                    className="border-ink bg-cream shadow-paper-sm block border-2 p-1.5 transition-all duration-300 hover:shadow-none motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1"
                  >
                    <div className="flex items-start gap-1">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1 h-[6px] w-[6px] shrink-0 rounded-full",
                          EVENT_TYPE_FILL[event.eventType],
                        )}
                      />
                      <span className="text-ink line-clamp-2 text-xs leading-tight font-semibold">
                        {event.title}
                      </span>
                    </div>
                    {time && (
                      <span className="text-ink-muted mt-0.5 block font-mono text-[10px]">
                        {time}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
