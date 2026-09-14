import ical from "ical-generator";
import { getVtimezoneComponent } from "@touch4it/ical-timezones";
import { DateTime } from "luxon";
import type { Match } from "@kcvv/api-contract";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import { SITE_CONFIG } from "@/lib/constants";
// Doubles as the calendar's `TZID` — an iCal protocol value, not only a display
// pin — so it is read from the one home rather than restated.
import { CLUB_TIMEZONE as TIMEZONE, toMatchDisplayZone } from "./dates";
import { resolveEventDateRange } from "./event-datetime";
import { buildEventUid } from "./event-uid";
import {
  matchRowKind,
  reservationTitle,
  reservationView,
} from "./match-display";

export type MatchSide = "home" | "away" | "all";

interface IcalEntryBase {
  id: string;
  summary: string;
  location?: string;
  url: string;
}

export interface TimedIcalEntry extends IcalEntryBase {
  allDay?: false;
  start: DateTime;
  end?: DateTime;
  description?: string;
}

export interface AllDayIcalEntry extends IcalEntryBase {
  allDay: true;
  start: DateTime;
  end: DateTime;
}

/**
 * A normalised item `generateIcal` knows how to emit as one `VEVENT` (#2717).
 * The generator itself has no idea a `Match` or an `EventListItemVM` exists —
 * `matchToEntry`/`eventToEntry` (below) are the only places that translate a
 * domain object into this shape, applied by `matchesToEntries`/
 * `eventsToEntries` before `generateIcal` ever sees the collection.
 *
 * A discriminated union rather than one bag of optional fields: an all-day
 * entry always carries a real `end` (the exclusive next-day roll,
 * `resolveEventDateRange`'s `allDayEndExclusive`) and never a `description`
 * (only a match's mapper ever sets one); a timed entry's `end` is genuinely
 * optional (an event with no stated end omits it rather than fabricating a
 * duration — a match's own `matchToEntry` always supplies one).
 */
export type IcalEntry = TimedIcalEntry | AllDayIcalEntry;

/**
 * What this feed carries — resolved once (from the route's `events=1` query
 * flag, via `resolveFeedVariant`) and threaded through as this one value
 * rather than re-derived at each of `NAME`/`X-WR-CALDESC`/the download
 * filename (#2717). `CalendarSubscribePanel.buildWebcalUrl` (#2705) is the
 * other consumer of the flag — it builds the same `events=1` query param
 * client-side, from the constants re-exported below.
 */
export type FeedVariant = "matches" | "matches-and-events";

// Re-exported for server-side consumers of this module (e.g. `route.ts`).
// The canonical definition lives in `calendar-feed-query.ts`, a client-safe
// leaf module `CalendarSubscribePanel` ("use client") can import directly.
export {
  CALENDAR_EVENTS_PARAM,
  CALENDAR_EVENTS_PARAM_VALUE,
} from "./calendar-feed-query";

interface FeedVariantMeta {
  name: string;
  caldesc: string;
  filename: string;
}

const FEED_VARIANT_META: Record<FeedVariant, FeedVariantMeta> = {
  matches: {
    name: "KCVV Elewijt — Wedstrijden",
    caldesc: "Wedstrijdkalender van KCVV Elewijt",
    filename: "kcvv-wedstrijden.ics",
  },
  "matches-and-events": {
    name: "KCVV Elewijt — Wedstrijden & Activiteiten",
    caldesc: "Wedstrijden en clubactiviteiten van KCVV Elewijt",
    filename: "kcvv-wedstrijden-en-activiteiten.ics",
  },
};

/** The single place `NAME`/`X-WR-CALDESC`/the download filename read from. */
export function getFeedVariantMeta(variant: FeedVariant): FeedVariantMeta {
  return FEED_VARIANT_META[variant];
}

/** The one place the `events=1` query flag becomes a `FeedVariant`. */
export function resolveFeedVariant(includeEvents: boolean): FeedVariant {
  return includeEvents ? "matches-and-events" : "matches";
}

/**
 * Whether `match` belongs on the "home" side of the ICS feed (`?side=home`
 * vs. `?side=away`, #2698). Reads the BFF-resolved `is_home`/`is_placeholder`
 * fields — never a team name (#2491 retired the `home_team.name` substring
 * match this replaces; never re-derive home/away by name here again).
 *
 * A pitch-reservation placeholder (#2606) has `home_team.id === away_team.id`
 * — the club's own booking with no designated away side — so it always reads
 * as home regardless of what `is_home` itself resolved to for the booking:
 * `side=home` includes it and `side=away` excludes it (#2698). Verified
 * against `ical.test.ts`'s "is treated as a home fixture" case rather than
 * assumed.
 */
function isHomeSide(match: Match): boolean {
  if (match.is_placeholder) return true;
  return match.is_home === true;
}

/**
 * A pitch-reservation placeholder (#2606) gets its own summary rather than
 * "KCVV Elewijt - KCVV Elewijt" — via the shared `reservationTitle()`
 * (`lib/utils/match-display.ts`), the same helper `formatMatchTitle()`
 * (`/wedstrijd/[matchId]/utils.ts`, the match detail page's SEO title) calls,
 * so the wording can't drift between the two surfaces (#2698).
 *
 * Also folds in `statusWording` (e.g. "Afgelast"), the way every other
 * reservation renderer does (`<TeamAgendaRow>`, `<MatchStripView>`,
 * `<MatchHero>`, `<CalendarWeek>`, `<UpcomingMatchesClient>`) — a cancelled
 * reservation carries no opponent or score to otherwise hint that anything
 * changed, and a subscriber's calendar app has no other way to show it.
 * Scoped to the reduced branch only: an ordinary match has the same gap
 * today, but that is a separate, pre-existing concern (out of scope here).
 *
 * One branch, not two (#2802 review) — a tournament fixture with no result
 * yet (#2696) gets the exact same treatment as a reservation, since
 * `reservationTitle()` already resolves both members of `matchRowKind()`
 * (subject-only for a reservation, "subject · other club" for a reduced
 * fixture) and `statusWording` reads only `match.status`, which neither
 * branch needed the other's `otherClub` lookup for in the first place.
 */
function buildSummary(match: Match): string {
  if (matchRowKind(match) !== "match") {
    const { statusWording } = reservationView(match);
    return `${reservationTitle(match)}${
      statusWording ? ` — ${statusWording.longForm}` : ""
    }`;
  }
  if (
    match.status === "finished" &&
    match.home_team.score != null &&
    match.away_team.score != null
  ) {
    return `${match.home_team.name} ${match.home_team.score}-${match.away_team.score} ${match.away_team.name}`;
  }
  return `${match.home_team.name} - ${match.away_team.name}`;
}

/**
 * No `is_placeholder` branch needed here (verified for #2698): this reads
 * only `competition`/`squadLabel`, never `home_team`/`away_team`, so it
 * cannot reproduce the "X - X" bug `buildSummary()` had. For a reservation
 * with a `competition` set, the description is a verbatim repeat of the
 * summary's subject (`DESCRIPTION:Jeugdtornooi`) rather than genuinely new
 * information — acceptable for an ICS `DESCRIPTION` field, which has no
 * neighbouring "subject" line of its own to duplicate the way an on-page
 * slot would (the Writer Rule's metadata/OG carve-out applies the same way
 * here). `squadLabel` never actually appears alongside it: the contract
 * field (`packages/api-contract/src/schemas/match.ts`) has no writer on the
 * `getMatches` path this route reads — worth its own issue, not chased here.
 */
function buildDescription(match: Match): string {
  const parts: string[] = [];
  if (match.competition) parts.push(match.competition);
  if (match.squadLabel) parts.push(match.squadLabel);
  return parts.join(" — ");
}

/**
 * `match.venue` is the single source now (#2491): the BFF stamps it for a
 * home fixture and leaves it absent for an away one, an unresolved
 * `is_home`, a pitch-reservation placeholder, or an unconfirmed tournament
 * fixture with no result yet (#2606/#2696/#2802 review) — see
 * `resolveVenue`/`isRealFixture` in `apps/api/src/psd/venue.ts`, the "guard
 * you must not bypass" this app no longer needs to apply itself. Being
 * listed as `home_team` never asserted the club's own street address here
 * either: a reservation or an unconfirmed tournament fixture may be nowhere
 * near the club's own pitch.
 */
function buildLocation(match: Match): string | undefined {
  return match.venue;
}

/**
 * The fixture's kickoff as a Brussels wall-clock DateTime, which is what a
 * `DTSTART;TZID=Europe/Brussels` line means.
 *
 * A BFF match date is not an instant — its UTC fields already *are* Belgian
 * wall-clock — so `toMatchDisplayZone` reads it and `match.time`, when the feed
 * carries one, only overrides the hour and minute. Converting instead (the
 * pre-#2601 `time`-less branch) put every such fixture in the subscribed feed
 * one or two hours late, and rolled a 22:00 kickoff onto the next day.
 *
 * `match.time` is unvalidated free text upstream (`S.optional(S.String)` on
 * `Match` in `packages/api-contract/src/schemas/match.ts`) — a malformed
 * value (`"15"`, `"aa:bb"`) parses to a non-finite hour/minute, and Luxon's
 * `DateTime#set` throws on those rather than returning an invalid `DateTime`.
 * Guarding here, before `.set()` runs, means this always *returns* an invalid
 * `DateTime` instead — `matchToEntry` can then check `.isValid` the same way
 * `eventToEntry` checks its own parse, instead of the throw escaping and
 * 500ing the whole feed for every subscriber over one malformed fixture.
 */
function buildStartDateTime(match: Match): DateTime {
  // Minute precision, as the pre-#2601 `fromObject` call implicitly had: PSD
  // never sends seconds, and a stray one would land in a DTSTART line.
  const start = toMatchDisplayZone(match.date).startOf("minute");
  if (!match.time) return start;
  const [hours, minutes] = match.time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return DateTime.invalid("malformed match.time");
  }
  return start.set({ hour: hours, minute: minutes });
}

/**
 * The match-fixture cache key: `teamIds`/`side` only. `events` (#2704) is
 * deliberately absent — since #2711 round 2, club activities are cached
 * under their own fixed key (`ical:events`, in `route.ts`) and composed with
 * these fixtures per request, so which teams/sides are in scope never
 * depends on whether activities are included. An `events=1` and an
 * `events=0` request for the same `teamIds`/`side` therefore share this same
 * key, instead of each duplicating the PSD fan-out.
 */
export function normalizeCacheKey(
  teamIds: string | null,
  side: string,
): string {
  const sortedIds = teamIds
    ? teamIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .sort()
        .join(",")
    : "all";
  return `ical:${sortedIds}:${side}`;
}

/**
 * A `Match` → `IcalEntry`, applied per item before `generateIcal` ever runs.
 * Returns `undefined` for an unparseable `match.time` rather than throwing —
 * mirroring `eventToEntry`'s guard below, and for the same reason: PSD data
 * is known-messy, and one malformed fixture must not take down the feed for
 * every subscriber.
 */
function matchToEntry(match: Match): TimedIcalEntry | undefined {
  const start = buildStartDateTime(match);
  if (!start.isValid) return undefined;

  return {
    // `kcvv-match-` is the other half of the namespace disjointness
    // `buildEventUid` (`event-uid.ts`) documents for `kcvv-event-` — kept
    // as a local literal since matches have no shared-surface UID to unify.
    id: `kcvv-match-${match.id}@kcvvelewijt.be`,
    summary: buildSummary(match),
    start,
    end: start.plus({ hours: 2 }),
    description: buildDescription(match),
    url: `${SITE_CONFIG.siteUrl}/wedstrijd/${match.id}`,
    location: buildLocation(match),
  };
}

/**
 * The pre-mapping stage for matches (#2717): dedupe by id, filter by `side`,
 * sort by date — all three ran inside `generateIcal` itself pre-refactor.
 * `side` (home/away) is a fixture-only concept, so it is applied here rather
 * than in `generateIcal`, which no longer knows what a `Match` is at all.
 * Drops any entry `matchToEntry` couldn't parse, the same way
 * `eventsToEntries` drops an unparseable event.
 */
export function matchesToEntries(
  matches: readonly Match[],
  side: MatchSide = "all",
): TimedIcalEntry[] {
  const seen = new Set<number>();
  const unique = matches.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const filtered =
    side === "home"
      ? unique.filter(isHomeSide)
      : side === "away"
        ? unique.filter((m) => !isHomeSide(m))
        : unique;

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return sorted
    .map(matchToEntry)
    .filter((entry): entry is TimedIcalEntry => entry !== undefined);
}

/**
 * An `EventListItemVM` → `IcalEntry`. Returns `undefined` for an unparseable
 * `dateStart` (reachable via `EVENTS_QUERY`'s `coalesce(dateStart, "")` on a
 * malformed doc) rather than throwing — matching `mergeEventFeed`/
 * `<EventMonthList>`'s handling of the same row. `ical-generator` throws on an
 * invalid Luxon `start`, which would 500 the whole feed otherwise.
 *
 * `ical-generator`'s all-day `DTEND` is inclusive (it emits whatever `end` it
 * is given verbatim) — the exclusive next-day roll is
 * `resolveEventDateRange`'s `allDayEndExclusive`, computed once for both this
 * and `buildEventIcs`. A timed item with no `dateEnd` omits `end` entirely
 * rather than fabricating a duration the way a match's fixed 2h block does.
 */
function eventToEntry(item: EventListItemVM): IcalEntry | undefined {
  const { isAllDay, start, end, allDayEndExclusive } = resolveEventDateRange(
    item.dateStart,
    item.dateEnd,
  );

  if (!start.isValid) return undefined;

  const location = item.location ?? undefined;
  const url = `${SITE_CONFIG.siteUrl}${item.href}`;
  const id = buildEventUid(item.id);
  const summary = item.title;

  if (isAllDay) {
    return {
      id,
      summary,
      allDay: true,
      start,
      end: allDayEndExclusive,
      url,
      location,
    };
  }

  return {
    id,
    summary,
    start,
    // An invalid `end` is dropped the same way a missing one is above.
    end: end?.isValid ? end : undefined,
    url,
    location,
  };
}

/**
 * The pre-mapping stage for club activities (#2704, #2717).
 * `EventRepository.findUpcomingForList()` is already upcoming-only and
 * chronologically sorted by construction (its own GROQ filters +
 * `mergeEventFeed`'s sort), so no re-filter/re-sort happens here — only the
 * per-item map, dropping any entry `eventToEntry` couldn't parse.
 */
export function eventsToEntries(
  events: readonly EventListItemVM[],
): IcalEntry[] {
  return events
    .map(eventToEntry)
    .filter((entry): entry is IcalEntry => entry !== undefined);
}

/** Emits one `VEVENT` for a normalised entry — the whole of `generateIcal`'s per-item knowledge. */
function emitEntry(cal: ReturnType<typeof ical>, entry: IcalEntry): void {
  if (entry.allDay) {
    cal.createEvent({
      id: entry.id,
      summary: entry.summary,
      allDay: true,
      start: entry.start,
      end: entry.end,
      url: entry.url,
      ...(entry.location ? { location: entry.location } : {}),
    });
    return;
  }

  cal.createEvent({
    id: entry.id,
    summary: entry.summary,
    start: entry.start,
    timezone: TIMEZONE,
    url: entry.url,
    ...(entry.end ? { end: entry.end } : {}),
    ...(entry.description !== undefined
      ? { description: entry.description }
      : {}),
    ...(entry.location ? { location: entry.location } : {}),
  });
}

/**
 * Emission-only (#2717): turns a normalised `IcalEntry[]` into a `.ics`
 * document. Knows nothing about a `Match` or an `EventListItemVM` — every
 * domain concern (dedup, `side` filtering, sorting, all-day classification,
 * UID scheme) is resolved upstream by `matchesToEntries`/`eventsToEntries`
 * before this ever runs. `variant` is the feed-variant descriptor
 * (`resolveFeedVariant`), threaded through once for `NAME`/`X-WR-CALDESC`
 * rather than re-derived here.
 */
export function generateIcal(
  items: readonly IcalEntry[],
  variant: FeedVariant = "matches",
): string {
  const meta = getFeedVariantMeta(variant);

  const cal = ical({
    name: meta.name,
    prodId: "-//KCVV Elewijt//Wedstrijdkalender//NL",
    timezone: {
      name: TIMEZONE,
      generator: getVtimezoneComponent,
    },
    x: {
      "X-WR-CALDESC": meta.caldesc,
      "X-WR-TIMEZONE": TIMEZONE,
    },
  });

  for (const entry of items) {
    emitEntry(cal, entry);
  }

  return cal.toString();
}

/**
 * The thin composition layer (#2717) between the route's raw `Match[]`/
 * `EventListItemVM[]` reads and the emission-only `generateIcal`: applies
 * `matchesToEntries`/`eventsToEntries`, then concatenates matches before
 * events — a club activity is never interleaved by date with the fixtures,
 * matching the pre-refactor two-loop order — before calling `generateIcal`
 * with the already-resolved `variant`.
 *
 * `events` is always mapped and included — there is no second gate on
 * `variant` here. The caller decides what to pass (the route passes `[]`
 * when the `events=1` flag is off, so it never fetches the activities feed
 * at all); gating on `variant` a second time inside this function would only
 * ever matter for a call the route can't make, while quietly discarding
 * `events` for any future caller (e.g. #2705's `buildWebcalUrl` toggle) that
 * computes `variant` and `events` from different places.
 */
export function buildIcalFeed(
  matches: readonly Match[],
  events: readonly EventListItemVM[],
  variant: FeedVariant,
  side: MatchSide = "all",
): string {
  const matchEntries = matchesToEntries(matches, side);
  const eventEntries = eventsToEntries(events);

  return generateIcal([...matchEntries, ...eventEntries], variant);
}
