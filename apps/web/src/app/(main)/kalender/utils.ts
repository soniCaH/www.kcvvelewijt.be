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
import type {
  CompetitionType,
  MatchStatus,
  ScheduleRow,
} from "@/components/match/types";
import {
  getScoreDisplay,
  matchRowKind,
  otherClubSide,
  reservationView,
  type ScoreDisplay,
} from "@/lib/utils/match-display";
import { assertNever } from "@/lib/utils/assert-never";
import { capitalize } from "@/lib/utils/capitalize";
import {
  CLUB_TIMEZONE,
  toDisplayZone,
  toMatchDisplayZone,
} from "@/lib/utils/dates";
import type { ItemListEntry } from "@/lib/seo/jsonld";
export type { ScoreDisplay } from "@/lib/utils/match-display";

export interface CalendarTeam {
  id: number;
  name: string;
  logo?: string;
}

/** Fields every `CalendarMatch` member carries regardless of `kind` (#2802). */
interface CalendarMatchCommon {
  id: number;
  date: string;
  time?: string;
  status: MatchStatus;
  competition?: string;
  /** Which KCVV squad plays (e.g. "U13") — not a club identity, see `club` below. */
  team?: string;
}

export interface CalendarMatchFixture extends CalendarMatchCommon {
  /** Discriminant against `CalendarReservation`/`CalendarReducedMatch`. */
  kind: "match";
  homeTeam: CalendarTeam;
  awayTeam: CalendarTeam;
  homeScore?: number;
  awayScore?: number;
  scoreDisplay: ScoreDisplay;
  isHome?: boolean;
  competitionType?: CompetitionType;
}

/**
 * A pitch-reservation placeholder (#2606) on `/kalender`. `homeTeam`/
 * `awayTeam`/scores do not exist here — a renderer reaching for them without
 * narrowing `kind` first fails to compile, mirroring `ScheduleReservation`.
 */
export interface CalendarReservation extends CalendarMatchCommon {
  /** Discriminant against `CalendarMatchFixture`/`CalendarReducedMatch`. */
  kind: "reservation";
  /** The club's own crest/name — a self-match has no second side. */
  club: CalendarTeam;
}

/**
 * A tournament fixture with a hidden result (#2696) on `/kalender` — see
 * `ScheduleReducedMatch` for the full rationale. `club` is the *other* club,
 * resolved via id equality, never home/away.
 */
export interface CalendarReducedMatch extends CalendarMatchCommon {
  /** Discriminant against `CalendarMatchFixture`/`CalendarReservation`. */
  kind: "reduced";
  club: CalendarTeam;
  competitionType?: CompetitionType;
}

/**
 * A genuine fixture, a pitch-reservation placeholder, or a tournament
 * fixture with a hidden result (#2688/#2802). `kind` is the sole
 * discriminant across the three-way split.
 */
export type CalendarMatch =
  CalendarMatchFixture | CalendarReservation | CalendarReducedMatch;

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
  /**
   * Feed source — `"event"` (a `event` doc → `/evenementen/[slug]`) vs
   * `"article"` (an `articleType:event` article → `/nieuws/[slug]`). Carried so
   * the `kalender_item_click` analytics can report the `source` param without
   * re-deriving it from the href.
   */
  source: "event" | "article";
}

export interface CalendarTeamInfo {
  id: string;
  name: string;
  psdId: number;
  label: string;
}

/**
 * `kind` is resolved once via the shared `matchRowKind()` and switched over
 * explicitly (#2802 review) rather than three cascading `if`s ending in a
 * bare fallthrough `return` — see `transformMatchToSchedule`'s docblock in
 * `@/components/match/transform` for why the unreachable
 * `default: assertNever(kind)` is load-bearing.
 */
export function transformMatchToCalendar(match: Match): CalendarMatch {
  const kind = matchRowKind(match);

  switch (kind) {
    case "reservation":
      return {
        kind,
        id: match.id,
        date: match.date.toISOString(),
        time: match.time,
        club: {
          id: match.home_team.id,
          name: match.home_team.name,
          logo: match.home_team.logo,
        },
        status: match.status,
        competition: match.competition,
        team: match.kcvv_team_label,
      };
    case "reduced": {
      const other = otherClubSide(match.home_team, match.away_team);
      return {
        kind,
        id: match.id,
        date: match.date.toISOString(),
        time: match.time,
        club: { id: other.id, name: other.name, logo: other.logo },
        status: match.status,
        competition: match.competition,
        competitionType: match.competitionType,
        team: match.kcvv_team_label,
      };
    }
    case "match":
      return {
        kind,
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
        competitionType: match.competitionType,
        team: match.kcvv_team_label,
        isHome: match.is_home,
      };
    default:
      return assertNever(kind);
  }
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
    source: item.source,
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

/** Filter selection: a specific kalender type, or `"all"` (the default — no filter). */
export type KalenderFilterValue = KalenderType | "all";

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

/**
 * Feed item → epoch ms sort key; an unparseable date sorts to the end (not
 * NaN). Keyed per item rather than per comparison — the comparator runs
 * O(n log n) times and a Luxon parse is ~1.5µs, which a full season of fixtures
 * turns into tens of milliseconds on a `force-dynamic` route.
 *
 * The two sources need different reads to produce the *same* kind of number.
 * An event's `dateStart` is already an instant, so reading it as UTC is the
 * stored contract and no zone can change the result. A match's is wall-clock in
 * its UTC fields, so the same read is two hours out — which is a real ordering
 * bug, not a cosmetic one: it interleaved a 15:00 kickoff *after* a 16:00
 * Brussels event in the page's `ItemList` JSON-LD, and kept a match "upcoming"
 * for two hours past kickoff in the `>= nowMs` cutoff below (#2601).
 * `toMatchDisplayZone` returns a correct instant, so `toMillis()` is comparable
 * with the event key.
 */
function toFeedSortKey(item: CalendarFeedItem): number {
  const dt =
    item.source === "match"
      ? toMatchDisplayZone(item.dateStart)
      : DateTime.fromISO(item.dateStart, { zone: "utc" });
  const ms = dt.toMillis();
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

/**
 * First of a calendar month in the club's zone — the month grid, the month nav
 * label and the agenda window all start from the same construction rather than
 * `DateTime.local()`, which would take the runtime zone.
 */
function clubMonthStart(year: number, month: number): DateTime {
  return DateTime.fromObject(
    { year, month, day: 1 },
    { zone: CLUB_TIMEZONE, locale: "nl" },
  );
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
  const matchItems = matches.map((match): CalendarFeedItem => ({
    source: "match",
    id: `match-${match.id}`,
    dateStart: match.date,
    kalenderType: "Wedstrijden",
    match,
  }));

  const eventItems = events.map((event): CalendarFeedItem => ({
    source: event.source,
    id: event.id,
    dateStart: event.dateStart,
    kalenderType: event.eventType ?? DEFAULT_EVENT_TYPE,
    event: eventListItemToCalendarEvent(event),
  }));

  // Key once per item, not twice per comparison — see `toFeedSortKey`.
  return [...matchItems, ...eventItems]
    .map((item) => ({ item, key: toFeedSortKey(item) }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

/**
 * The `ItemList` entry's label for one match — a `name`, not a fixture
 * assertion, so (unlike `SportsEvent` JSON-LD) a reservation/reduced row
 * isn't dropped, just named by its subject instead of "home — away" (#2606).
 * Switched exhaustively over `kind` (#2802 review) rather than a nested
 * ternary, so a fourth member is a compile error here too.
 */
function matchEntryName(match: CalendarMatch): string {
  switch (match.kind) {
    case "match":
      return `${match.homeTeam.name} — ${match.awayTeam.name}`;
    case "reservation":
      return reservationView(match).subject;
    case "reduced":
      return reservationView(match, match.club).subject;
    default:
      return assertNever(match);
  }
}

/**
 * Project the feed onto upcoming `{ name, url }` entries for the page's
 * `ItemList` JSON-LD (SEO summary, not per-item Event schema). Matches link to
 * `/wedstrijd/[id]`, events/articles to their resolved `href`. Filtered to items
 * at/after `nowMs` (matches are full-season, so past ones are dropped) and
 * capped at `limit`. Pure — `nowMs` is injectable for deterministic tests. The
 * entry shape (`ItemListEntry`) is owned by the seo builder it feeds.
 */
export function buildKalenderItemListEntries(
  feed: CalendarFeedItem[],
  siteUrl: string,
  options: { nowMs?: number; limit?: number } = {},
): ItemListEntry[] {
  const nowMs = options.nowMs ?? Date.now();
  const limit = options.limit ?? 30;
  return feed
    .filter((item) => toFeedSortKey(item) >= nowMs)
    .slice(0, limit)
    .map((item) =>
      item.source === "match"
        ? {
            name: matchEntryName(item.match),
            url: `${siteUrl}/wedstrijd/${item.match.id}`,
          }
        : { name: item.event.title, url: `${siteUrl}${item.event.href}` },
    );
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
 *
 * Matches bucket through `toMatchDisplayZone` and events through
 * `toDisplayZone` — the two sources carry opposite conventions, and a match
 * bucketed as an instant lands on the wrong day for any kickoff at/after 22:00.
 */
export function groupFeedByDay(
  matches: CalendarMatch[],
  events: CalendarEvent[],
): Map<string, DayFeed> {
  const map = new Map<string, DayFeed>();

  for (const match of matches) {
    const dt = toMatchDisplayZone(match.date);
    if (!dt.isValid) continue;
    ensureDayFeed(map, dt.toISODate()!).matches.push(match);
  }

  for (const event of events) {
    const start = toDisplayZone(event.dateStart);
    if (!start.isValid) continue;
    // The start day always carries the event…
    ensureDayFeed(map, start.toISODate()!).events.push(event);
    // …and every later day it spans (inclusive), for a valid multi-day end.
    if (event.dateEnd) {
      const end = toDisplayZone(event.dateEnd);
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
  const firstOfMonth = clubMonthStart(year, month);
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
  const dt = toDisplayZone(dateStr);
  const monday = dt.startOf("week"); // Luxon weeks start on Monday by default
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(monday.plus({ days: i }).toISODate()!);
  }
  return days;
}

/**
 * Determine the match-day pip's venue class. `"reservation"` for a
 * pitch-reservation placeholder (#2606) — a self-match has no home/away side
 * to claim, and resolving one via `isHome`/name-matching (as #2688 found this
 * function doing) renders a reserved slot as an ordinary home fixture on the
 * month grid. Also `"reservation"` for a tournament fixture with a hidden
 * result (#2696/#2802) — PSD does not say whether the named club hosts or
 * merely shares the bracket, so the dot claims no side there either, the
 * same "no side to claim" rule every other reduced renderer follows.
 */
export type MatchDotType = "home" | "away" | "reservation";

export function getMatchDotType(match: CalendarMatch): MatchDotType {
  switch (match.kind) {
    case "reservation":
    case "reduced":
      return "reservation";
    case "match":
      if (match.isHome != null) {
        return match.isHome ? "home" : "away";
      }
      // Fallback for matches without BFF-computed isHome
      return match.homeTeam.name.toLowerCase().includes("kcvv")
        ? "home"
        : "away";
    default:
      return assertNever(match);
  }
}

/**
 * The visual treatment for a match-day pip/dot, keyed by `getMatchDotType`'s
 * return — one map instead of two hand-copied ternary chains
 * (`CalendarMonth`'s grid pip, `CalendarWeek`'s day-cell dot; the home/away
 * pair was already duplicated between the two before #2688 added the third
 * state to both copies). Deliberately excludes size: the two consumers draw
 * their dot at different diameters, so each appends its own `h-*`/`w-*` via
 * `cn()`.
 */
export const MATCH_DOT_CLASS: Record<MatchDotType, string> = {
  home: "bg-card-red",
  away: "border-card-red border-[1.5px] bg-transparent",
  // A pitch-reservation placeholder has no side to claim (#2606) — a dashed
  // ring keeps the "Wedstrijden" category red (#1992) without claiming home
  // OR away.
  reservation: "border-card-red border-[1.5px] border-dashed bg-transparent",
};

/**
 * Adapt a `CalendarMatch` (route VM, `date: string`) to the `ScheduleRow`
 * shape the 6.C `<TeamAgendaRow>` consumes (`date: Date`). Reused by the
 * grid's selected-day detail so the calendar renders the locked 6.C scoreboard
 * vocabulary instead of a bespoke row.
 *
 * Branches on `match.kind` into the three `ScheduleRow` members (#2688/#2802)
 * — this was the two-hop chain's silent hole: `isHome` crossed both hops,
 * the reservation/reduced discriminant crossed neither, so the same
 * reservation that renders reduced on the team page rendered as an ordinary
 * two-crest linked scoreboard here.
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
): ScheduleRow {
  switch (match.kind) {
    case "reservation":
      return {
        kind: match.kind,
        id: match.id,
        date: new Date(match.date),
        time: match.time,
        team: match.club,
        status: match.status,
        competition: match.competition,
      };
    case "reduced":
      return {
        kind: match.kind,
        id: match.id,
        date: new Date(match.date),
        time: match.time,
        team: match.club,
        status: match.status,
        competition: match.competition,
        competitionType: match.competitionType,
      };
    case "match": {
      const dotType = getMatchDotType(match);
      return {
        kind: match.kind,
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
        competitionType: match.competitionType,
        isHome: match.isHome ?? dotType === "home",
      };
    }
    default:
      return assertNever(match);
  }
}

// The date labels below are route chrome, not site vocabulary — a week-range
// label is not a shape any other route renders — so they stay local (#2430
// rule 2). What they may not do is invent their own zone or locale handling:
// each parses through the shared `toDisplayZone` and formats with Luxon's
// `toFormat`, never `toLocale*`, which would resolve month and weekday names
// from whatever ICU data the runtime happens to ship.

/**
 * Day-detail / agenda day heading — `"Zaterdag 12 september"` (weekday
 * capitalised, club locale). Used by the grid's selected-day detail and the
 * agenda's per-day groups so both read identically.
 */
export function formatDayDetailHeading(day: string): string {
  const dt = toDisplayZone(day);
  if (!dt.isValid) return day;
  return capitalize(dt.toFormat("cccc d MMMM"));
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
  return `${capitalize(clubMonthStart(year, month).toFormat("MMMM"))} '${String(year).slice(-2)}`;
}

/**
 * Week-range label for the shared period nav in Week view —
 * `"9 - 15 maart 2026"`, or `"28 feb - 6 maart 2026"` across a month boundary.
 */
export function formatWeekRangeLabel(weekStart: string): string {
  const days = getDaysInWeek(weekStart);
  const first = toDisplayZone(days[0]!);
  const last = toDisplayZone(days[6]!);
  const sameMonth = first.month === last.month && first.year === last.year;
  return sameMonth
    ? `${first.day} - ${last.day} ${first.toFormat("MMMM yyyy")}`
    : `${first.day} ${first.toFormat("MMMM")} - ${last.day} ${last.toFormat("MMMM yyyy")}`;
}

/**
 * Local kickoff/start time (`"18:00"`) for a feed item, or `null` for an all-day
 * item (`00:00`) — mirrors `<TicketStub>`'s rule so an all-day event shows no
 * spurious midnight time.
 */
const clockShape = (dt: DateTime): string | null => {
  if (!dt.isValid) return null;
  const time = dt.toFormat("HH:mm");
  return time === "00:00" ? null : time;
};

export function formatEventTime(iso: string): string | null {
  return clockShape(toDisplayZone(iso));
}

/**
 * The same rule over a *match* date, which is wall-clock rather than an
 * instant. Put through the instant parse, a 15:00 kickoff read "17:00" and a
 * fixture the feed sends with no time at all read "02:00" — a made-up kickoff
 * where the agenda should show none (#2601). As in `@/lib/utils/dates`, the
 * fork is at the parse and the shape is written once.
 */
export function formatMatchTime(iso: string): string | null {
  return clockShape(toMatchDisplayZone(iso));
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
  const first = clubMonthStart(year, month);
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
