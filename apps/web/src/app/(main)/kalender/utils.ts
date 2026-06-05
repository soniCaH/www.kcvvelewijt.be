/**
 * Calendar view-model utilities
 */

import { DateTime } from "luxon";
import type { Match } from "@/lib/effect/schemas/match.schema";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import {
  DEFAULT_EVENT_TYPE,
  type EventType,
} from "@/components/event/event-type-style";
import type { MatchStatus, ScheduleMatch } from "@/components/match/types";
import { getScoreDisplay, type ScoreDisplay } from "@/lib/utils/match-display";
export type { ScoreDisplay } from "@/lib/utils/match-display";

export interface CalendarTeam {
  id: number;
  name: string;
  logo?: string;
}

export interface CalendarMatch {
  id: number;
  date: string;
  time?: string;
  homeTeam: CalendarTeam;
  awayTeam: CalendarTeam;
  homeScore?: number;
  awayScore?: number;
  scoreDisplay: ScoreDisplay;
  status: MatchStatus;
  competition?: string;
  team?: string;
  isHome?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  href: string;
  /**
   * Resolved event category (`item.eventType ?? "Andere"`). Carried onto the
   * VM — not just the feed item's `kalenderType` facet — so the renderers that
   * consume the projected `CalendarEvent[]` (grid type-colour dot, agenda type
   * tag) can colour an event by type without re-deriving it.
   */
  eventType: EventType;
}

export interface CalendarTeamInfo {
  id: string;
  name: string;
  psdId: number;
  label: string;
}

export function transformMatchToCalendar(match: Match): CalendarMatch {
  return {
    id: match.id,
    date: match.date.toISOString(),
    time: match.time,
    homeTeam: {
      id: match.home_team.id,
      name: match.home_team.name,
      logo: match.home_team.logo,
    },
    awayTeam: {
      id: match.away_team.id,
      name: match.away_team.name,
      logo: match.away_team.logo,
    },
    homeScore: match.home_team.score,
    awayScore: match.away_team.score,
    scoreDisplay: getScoreDisplay(match),
    status: match.status,
    competition: match.competition,
    team: match.kcvv_team_label,
    isHome: match.is_home,
  };
}

/**
 * Project a merged-feed item (`EventRepository.findUpcomingForList()`) onto the
 * `CalendarEvent` shape the widget renders. The repo already resolves each
 * item's `href` — `/evenementen/[slug]` for `event` docs, `/nieuws/[slug]` for
 * `source: "article"` rows — so this only narrows the fields the calendar
 * consumes: a `null` end date becomes `undefined` (`CalendarEvent.dateEnd` is
 * optional, not nullable). Requiring the merged-feed `EventListItemVM` (which
 * the event-docs-only `EventVM` is not assignable to — it lacks `source`) keeps
 * the page on the 3-source feed; a revert to `findAll()` is a compile error.
 */
export function eventListItemToCalendarEvent(
  item: EventListItemVM,
): CalendarEvent {
  return {
    id: item.id,
    title: item.title,
    dateStart: item.dateStart,
    dateEnd: item.dateEnd ?? undefined,
    href: item.href,
    eventType: item.eventType ?? DEFAULT_EVENT_TYPE,
  };
}

/**
 * The kalender filter facet (#1992 — Phase 6.D Phase 2): the four event
 * categories plus `"Wedstrijden"` for PSD matches. `Wedstrijden` is NOT a Sanity
 * `eventType`, so this is a deliberate superset of `EventType` — it keeps the
 * strict `EVENT_TYPE_FILL` (`satisfies Record<EventType, …>`) untouched while
 * letting one predicate filter both matches and events.
 */
export type KalenderType = "Wedstrijden" | EventType;

/**
 * Unified calendar feed item — a discriminated union over `source` that merges
 * the two sources the calendar renders: PSD matches and the 6.E event feed
 * (`event` docs + `articleType:event` articles). Every item carries a single
 * `kalenderType` facet so the by-type filter narrows matches and events through
 * one predicate. The source payload is preserved so the existing month/week
 * renderers (which consume `CalendarMatch[]` / `CalendarEvent[]`) can be
 * projected back from a filtered feed without re-fetching.
 */
export type CalendarFeedItem =
  | {
      source: "match";
      id: string;
      dateStart: string;
      kalenderType: "Wedstrijden";
      match: CalendarMatch;
    }
  | {
      source: "event" | "article";
      id: string;
      dateStart: string;
      kalenderType: KalenderType;
      event: CalendarEvent;
    };

/** ISO → epoch ms sort key; an unparseable date sorts to the end (not NaN). */
function toFeedSortKey(iso: string): number {
  const ms = DateTime.fromISO(iso).toMillis();
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

/**
 * Compose PSD matches + the 6.E event feed into one chronological
 * `CalendarFeedItem[]`. Matches are tagged `"Wedstrijden"`; events/articles take
 * their `eventType` (a missing type → `"Andere"` via `DEFAULT_EVENT_TYPE`, the
 * same fallback `/evenementen` applies). Match ids are source-prefixed
 * (`match-<id>`) so a numeric PSD id can never collide with a Sanity `_id`.
 */
export function buildCalendarFeed(
  matches: CalendarMatch[],
  events: EventListItemVM[],
): CalendarFeedItem[] {
  const matchItems = matches.map(
    (match): CalendarFeedItem => ({
      source: "match",
      id: `match-${match.id}`,
      dateStart: match.date,
      kalenderType: "Wedstrijden",
      match,
    }),
  );

  const eventItems = events.map(
    (event): CalendarFeedItem => ({
      source: event.source,
      id: event.id,
      dateStart: event.dateStart,
      kalenderType: event.eventType ?? DEFAULT_EVENT_TYPE,
      event: eventListItemToCalendarEvent(event),
    }),
  );

  return [...matchItems, ...eventItems].sort(
    (a, b) => toFeedSortKey(a.dateStart) - toFeedSortKey(b.dateStart),
  );
}

const TIMEZONE = "Europe/Brussels";

/** Parse an ISO string into the club's local timezone */
function toLocalDate(iso: string): DateTime {
  return DateTime.fromISO(iso, { zone: TIMEZONE });
}

/** Filter matches whose date falls on the given YYYY-MM-DD, sorted by time */
export function getMatchesForDay(
  matches: CalendarMatch[],
  day: string,
): CalendarMatch[] {
  return matches
    .filter((m) => {
      const dt = toLocalDate(m.date);
      return dt.isValid && dt.toISODate() === day;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Filter events that span the given YYYY-MM-DD, sorted by start date */
export function getEventsForDay(
  events: CalendarEvent[],
  day: string,
): CalendarEvent[] {
  return events
    .filter((e) => {
      const start = toLocalDate(e.dateStart);
      if (!start.isValid) return false;
      const startDay = start.toISODate()!;
      if (startDay === day) return true;
      if (!e.dateEnd) return false;
      const end = toLocalDate(e.dateEnd);
      return end.isValid && day >= startDay && day <= end.toISODate()!;
    })
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart));
}

/** A single day's bucketed feed — matches + events, each time-sorted. */
export interface DayFeed {
  matches: CalendarMatch[];
  events: CalendarEvent[];
}

function ensureDayFeed(map: Map<string, DayFeed>, day: string): DayFeed {
  let entry = map.get(day);
  if (!entry) {
    entry = { matches: [], events: [] };
    map.set(day, entry);
  }
  return entry;
}

/**
 * Bucket the whole feed into a `dayISO → { matches, events }` map in a single
 * pass — each date is parsed once, not once per (cell × item). Replaces the
 * `O(days × items)` pattern of calling `getMatchesForDay`/`getEventsForDay` for
 * every grid cell / month day. Multi-day events surface under every day they
 * span (same semantics as `getEventsForDay`); buckets are time-sorted to match
 * the per-day helpers. Consumers `useMemo` this on `[matches, events]`.
 */
export function groupFeedByDay(
  matches: CalendarMatch[],
  events: CalendarEvent[],
): Map<string, DayFeed> {
  const map = new Map<string, DayFeed>();

  for (const match of matches) {
    const dt = toLocalDate(match.date);
    if (!dt.isValid) continue;
    ensureDayFeed(map, dt.toISODate()!).matches.push(match);
  }

  for (const event of events) {
    const start = toLocalDate(event.dateStart);
    if (!start.isValid) continue;
    // The start day always carries the event…
    ensureDayFeed(map, start.toISODate()!).events.push(event);
    // …and every later day it spans (inclusive), for a valid multi-day end.
    if (event.dateEnd) {
      const end = toLocalDate(event.dateEnd);
      if (end.isValid) {
        let cursor = start.startOf("day").plus({ days: 1 });
        const last = end.startOf("day");
        while (cursor <= last) {
          ensureDayFeed(map, cursor.toISODate()!).events.push(event);
          cursor = cursor.plus({ days: 1 });
        }
      }
    }
  }

  for (const entry of map.values()) {
    entry.matches.sort((a, b) => a.date.localeCompare(b.date));
    entry.events.sort((a, b) => a.dateStart.localeCompare(b.dateStart));
  }
  return map;
}

/** Empty day feed — a stable reference for cells/days with no items. */
export const EMPTY_DAY_FEED: DayFeed = { matches: [], events: [] };

/**
 * Returns YYYY-MM-DD strings for all day cells in a month grid.
 * Always starts on Monday and ends on Sunday, producing 35 or 42 cells.
 */
export function getDaysInMonth(year: number, month: number): string[] {
  const firstOfMonth = DateTime.local(year, month, 1);
  // ISO weekday: 1=Monday, 7=Sunday
  const startOffset = firstOfMonth.weekday - 1;
  const gridStart = firstOfMonth.minus({ days: startOffset });

  const daysInMonth = firstOfMonth.daysInMonth!;
  const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;

  const days: string[] = [];
  for (let i = 0; i < totalCells; i++) {
    days.push(gridStart.plus({ days: i }).toISODate()!);
  }
  return days;
}

/** Returns 7 YYYY-MM-DD strings (Mon-Sun) for the week containing `dateStr` */
export function getDaysInWeek(dateStr: string): string[] {
  const dt = DateTime.fromISO(dateStr);
  const monday = dt.startOf("week"); // Luxon weeks start on Monday by default
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(monday.plus({ days: i }).toISODate()!);
  }
  return days;
}

/** Determine if a match is home or away for KCVV */
export function getMatchDotType(match: CalendarMatch): "home" | "away" {
  if (match.isHome != null) {
    return match.isHome ? "home" : "away";
  }
  // Fallback for matches without BFF-computed isHome
  return match.homeTeam.name.toLowerCase().includes("kcvv") ? "home" : "away";
}

/**
 * Adapt a `CalendarMatch` (route VM, `date: string`) to the `ScheduleMatch`
 * shape the 6.C `<TeamAgendaRow>` consumes (`date: Date`). Reused by the
 * grid's selected-day detail so the calendar renders the locked 6.C scoreboard
 * vocabulary instead of a bespoke row.
 *
 * `/kalender` mixes every KCVV squad on one surface, so the squad context
 * (`match.team`, e.g. "U13"/"A-ploeg") is injected as the KCVV side's
 * `teamLabel` — `<TeamAgendaRow>` renders it beside the club name, surfacing
 * *which* KCVV team plays (on the team-detail page this is implicit, here it is
 * not). The opponent keeps no designation (the BFF gives none for the calendar
 * feed).
 */
export function calendarMatchToScheduleMatch(
  match: CalendarMatch,
): ScheduleMatch {
  const dotType = getMatchDotType(match);
  return {
    id: match.id,
    date: new Date(match.date),
    time: match.time,
    homeTeam: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      logo: match.homeTeam.logo,
      teamLabel: dotType === "home" ? match.team : undefined,
    },
    awayTeam: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      logo: match.awayTeam.logo,
      teamLabel: dotType === "away" ? match.team : undefined,
    },
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: match.status,
    competition: match.competition,
    isHome: match.isHome ?? dotType === "home",
  };
}

/** Capitalise the first letter (Dutch weekday/month headings render uppercase). */
function capitalizeFirst(value: string): string {
  return value.length === 0
    ? value
    : value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Day-detail / agenda day heading — `"Zaterdag 12 september"` (weekday
 * capitalised, club locale). Used by the grid's selected-day detail and the
 * agenda's per-day groups so both read identically.
 */
export function formatDayDetailHeading(day: string): string {
  const dt = DateTime.fromISO(day, { zone: TIMEZONE });
  if (!dt.isValid) return day;
  return capitalizeFirst(
    dt.toLocaleString(
      { weekday: "long", day: "numeric", month: "long" },
      { locale: "nl-BE" },
    ),
  );
}

/**
 * Count caption for a day group — `"10 wedstrijden · 1 evenement"`. Pluralised
 * for Dutch; only non-zero parts appear; returns `null` when the day is empty.
 */
export function formatItemCount(
  matchCount: number,
  eventCount: number,
): string | null {
  const parts: string[] = [];
  if (matchCount > 0) {
    parts.push(
      `${matchCount} ${matchCount === 1 ? "wedstrijd" : "wedstrijden"}`,
    );
  }
  if (eventCount > 0) {
    parts.push(
      `${eventCount} ${eventCount === 1 ? "evenement" : "evenementen"}`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Compact month label for the shared period nav + the agenda header —
 * `"September '26"` (capitalised Dutch month + apostrophe year). One formatter
 * keeps the toolbar nav (grid/agenda) and the agenda's `<EditorialHeading>` in
 * sync.
 */
export function formatMonthNavLabel(year: number, month: number): string {
  const monthName = DateTime.local(year, month, 1).toLocaleString(
    { month: "long" },
    { locale: "nl-BE" },
  );
  return `${capitalizeFirst(monthName)} '${String(year).slice(-2)}`;
}

/**
 * Week-range label for the shared period nav in Week view —
 * `"9 - 15 maart 2026"`, or `"28 feb - 6 maart 2026"` across a month boundary.
 */
export function formatWeekRangeLabel(weekStart: string): string {
  const days = getDaysInWeek(weekStart);
  const first = DateTime.fromISO(days[0]!);
  const last = DateTime.fromISO(days[6]!);
  const sameMonth = first.month === last.month && first.year === last.year;
  return sameMonth
    ? `${first.day} - ${last.day} ${first.toLocaleString({ month: "long", year: "numeric" }, { locale: "nl-BE" })}`
    : `${first.day} ${first.toLocaleString({ month: "long" }, { locale: "nl-BE" })} - ${last.day} ${last.toLocaleString({ month: "long", year: "numeric" }, { locale: "nl-BE" })}`;
}

/**
 * Local kickoff/start time (`"18:00"`) for a feed item, or `null` for an all-day
 * item (`00:00`) — mirrors `<TicketStub>`'s rule so an all-day event shows no
 * spurious midnight time.
 */
export function formatEventTime(iso: string): string | null {
  const dt = DateTime.fromISO(iso, { zone: TIMEZONE });
  if (!dt.isValid) return null;
  const time = dt.toFormat("HH:mm");
  return time === "00:00" ? null : time;
}

/** One day's worth of feed items in the agenda's labelled wall. */
export interface AgendaDayGroup {
  /** YYYY-MM-DD of the day. */
  date: string;
  /** Matches on this day, sorted by kickoff. */
  matches: CalendarMatch[];
  /** Events spanning this day, sorted by start. */
  events: CalendarEvent[];
}

/**
 * Group the feed into the agenda's per-day wall for a single navigated month
 * window (6.D lock — the agenda is month-windowed, never the whole season nor a
 * flat "all upcoming" feed). Returns only days that carry ≥1 item, in
 * chronological order; each day's matches/events are time-sorted. A multi-day
 * event surfaces under every day it spans within the window — the same span
 * semantics the grid uses. Buckets once via `groupFeedByDay`, then windows.
 */
export function buildMonthAgenda(
  matches: CalendarMatch[],
  events: CalendarEvent[],
  year: number,
  month: number,
): AgendaDayGroup[] {
  const byDay = groupFeedByDay(matches, events);
  const first = DateTime.local(year, month, 1);
  const daysInMonth = first.daysInMonth!;

  const groups: AgendaDayGroup[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const day = first.plus({ days: i }).toISODate()!;
    const entry = byDay.get(day);
    if (!entry || (entry.matches.length === 0 && entry.events.length === 0)) {
      continue;
    }
    groups.push({ date: day, matches: entry.matches, events: entry.events });
  }
  return groups;
}
