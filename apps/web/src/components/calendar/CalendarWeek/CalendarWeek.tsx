"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { clubToday, toDisplayZone } from "@/lib/utils/dates";
import { PRESS_DOWN_CLASSES } from "@/components/design-system/press-down";
import { MatchStatusBadge } from "@/components/match/MatchStatusBadge";
import { EVENT_TYPE_FILL } from "@/components/event/event-type-style";
import {
  isExceptionalMatchStatus,
  reservationView,
} from "@/lib/utils/match-display";
import { trackKalenderItemClick } from "../calendar-analytics";
import {
  getDaysInWeek,
  getMatchDotType,
  MATCH_DOT_CLASS,
  formatEventTime,
  groupFeedByDay,
  EMPTY_DAY_FEED,
} from "@/app/(main)/kalender/utils";
import type {
  CalendarMatch,
  CalendarReducedMatch,
  CalendarReservation,
  CalendarEvent,
} from "@/app/(main)/kalender/utils";

export interface CalendarWeekProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  weekStart: string;
}

const SHORT_DAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

/**
 * A pitch-reservation placeholder's reduced week-cell card (#2606, #2688) —
 * no opponent (a self-match has none), no link (mirrors #2606 decision 5),
 * just the club crest, the subject, and the real time. Same card chrome as
 * `WeekMatchCard` so it still reads as one system in the grid.
 *
 * Also renders a tournament fixture (#2696/#2715/#2802, `kind === "reduced"`).
 * The subject then names the **other club**, not KCVV's own — `match.club`
 * is precomputed by `transformMatchToCalendar` via club-id equality, never
 * home/away, since PSD does not say whether the named club hosts or merely
 * shares the bracket. The dot is always the dashed "reservation" treatment
 * here, never home/away — a tournament sheds the home/away claim the same
 * way a placeholder does (#2693): neither state in this card knows which
 * side, if either, was "home".
 */
function ReservationWeekCard({
  match,
}: {
  match: CalendarReservation | CalendarReducedMatch;
}) {
  const otherClub = match.kind === "reduced" ? match.club : undefined;
  const { subject, statusWording } = reservationView(match, otherClub);
  return (
    <div
      data-row-kind={match.kind}
      className="border-ink bg-cream shadow-paper-sm block border-2 p-1.5"
    >
      {match.team && (
        <div className="text-ink-muted mb-0.5 truncate font-mono text-[9px] font-semibold tracking-wider uppercase">
          {match.team}
        </div>
      )}
      <div className="flex items-center gap-1">
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            MATCH_DOT_CLASS.reservation,
          )}
        />
        <span className="text-ink-muted truncate font-mono text-[10px] font-semibold tracking-wide uppercase">
          {subject}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1">
        {match.time && (
          <span className="text-ink-muted font-mono text-[10px]">
            {match.time}
          </span>
        )}
        {/* A reservation can be called off the same way a real fixture can
            (#2606) — without this, a cancelled tournament reservation was
            visually identical to a live one, telling a parent to turn up for
            something that is off (`WeekMatchCard` above already had this
            for a real match). */}
        {statusWording && <MatchStatusBadge status={match.status} />}
      </div>
    </div>
  );
}

function WeekMatchCard({ match }: { match: CalendarMatch }) {
  // Enumerated positively (#2802 review) — see the identical
  // note on `CalendarAgenda`'s `AgendaMatchRow`.
  if (match.kind === "reservation" || match.kind === "reduced") {
    return <ReservationWeekCard match={match} />;
  }

  const dotType = getMatchDotType(match);
  const isHome = dotType === "home";
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
            MATCH_DOT_CLASS[dotType],
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
        {/* lining-nums, not tabular-nums (#2610) — the kit's tabular figures
            are inert. */}
        {match.scoreDisplay.type === "score" && (
          <span className="text-ink font-display text-[11px] font-bold lining-nums">
            {match.scoreDisplay.home}-{match.scoreDisplay.away}
          </span>
        )}
        {isExceptionalMatchStatus(match.status) && (
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
      className={cn(
        "border-ink bg-cream shadow-paper-sm block border-2 p-1.5",
        PRESS_DOWN_CLASSES,
      )}
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
  const today = clubToday();

  return (
    <div
      className="border-ink grid grid-cols-7 border-2"
      data-testid="week-grid"
    >
      {days.map((day, i) => {
        const dt = toDisplayZone(day);
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
                    className={cn(
                      "border-ink bg-cream shadow-paper-sm block border-2 p-1.5",
                      PRESS_DOWN_CLASSES,
                    )}
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
