import type { DateTime } from "luxon";
import { toDisplayZone } from "./dates";

/**
 * Parse a (UTC) ISO event datetime into a Brussels-zoned, nl-locale DateTime.
 *
 * The event domain's name for the site's one date parse — Sanity stores `event`
 * datetimes as real UTC instants, which is exactly `toDisplayZone`'s contract
 * (offset-less input read as UTC, never the runtime zone). It delegates rather
 * than re-deriving, so the zone lives in one place (#2430); the wrapper stays
 * because `parseEventDateTime(event.dateStart)` is what reads right at the
 * event call sites.
 *
 * Do **not** reach for this on a BFF `Match` date — that one is Belgian
 * wall-clock already, see `toMatchDisplayZone` in `./dates`.
 */
export function parseEventDateTime(iso: string): DateTime {
  return toDisplayZone(iso);
}

export interface EventDateRange {
  start: DateTime;
  end: DateTime | null;
  /** A Brussels-midnight start, with an end that is either absent or also midnight. */
  isAllDay: boolean;
  /**
   * The exclusive all-day `DTEND` day — a single day spans to the next
   * morning, a multi-day span ends the day after its last day. Only
   * meaningful when `isAllDay` is `true`; harmless (an invalid or otherwise
   * unused `DateTime`) when it isn't.
   */
  allDayEndExclusive: DateTime;
}

/**
 * The event domain's one all-day classification, shared by every surface
 * that renders an `.ics` VEVENT for an event/activity: the per-event "Zet in
 * agenda" download (`buildEventIcs`) and the subscribe feed's club-activity
 * VEVENTs (`ical.ts`'s `eventToEntry`). The two surfaces must agree on
 * which events render as all-day, or a subscriber sees the same event
 * described two different ways depending on which one they used — this used
 * to be a hand-copied predicate in both places, silently divergible.
 *
 * Classification only: each caller still owns its own *emission* (UTC stamps
 * written by hand vs. Luxon objects handed to `ical-generator`), which
 * differs enough between the two surfaces that sharing it would cost more
 * than it saves.
 */
export function resolveEventDateRange(
  dateStart: string,
  dateEnd?: string | null,
): EventDateRange {
  const start = parseEventDateTime(dateStart);
  const end = dateEnd ? parseEventDateTime(dateEnd) : null;
  const isAllDay =
    start.isValid &&
    start.toFormat("HH:mm") === "00:00" &&
    (!end?.isValid || end.toFormat("HH:mm") === "00:00");
  const lastDay = end?.isValid && end > start ? end : start;
  return {
    start,
    end,
    isAllDay,
    allDayEndExclusive: lastDay.plus({ days: 1 }),
  };
}

/**
 * A genuine multi-day span: the end falls on a later Brussels day. A missing,
 * same-day or reversed end reads as a single-day event, and so does a timed
 * evening that ends at midnight (an all-day end at midnight is its last day,
 * as in `resolveEventDateRange`).
 */
export function isMultiDayEvent(
  start: DateTime,
  end: DateTime | null,
): end is DateTime {
  if (!start.isValid || !end?.isValid || end <= start) return false;
  const endsAtMidnight = end.toFormat("HH:mm:ss.SSS") === "00:00:00.000";
  const timedStart = start.toFormat("HH:mm") !== "00:00";
  const last =
    endsAtMidnight && timedStart ? end.minus({ milliseconds: 1 }) : end;
  return !start.hasSame(last, "day");
}

/**
 * The day line of a `/share` story (#3535): `zaterdag 18 oktober`, or for a
 * multi-day event `zaterdag 12 – zondag 13 oktober` (month named once when
 * both days share it).
 */
export function formatEventDays(start: DateTime, end: DateTime | null): string {
  if (!start.isValid) return "";
  if (!isMultiDayEvent(start, end)) return start.toFormat("cccc d MMMM");
  const head = start.toFormat(
    start.hasSame(end, "month") ? "cccc d" : "cccc d MMMM",
  );
  return `${head} – ${end.toFormat("cccc d MMMM")}`;
}
