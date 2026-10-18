import { DateTime } from "luxon";
import { capitalize } from "./capitalize";
import { CLUB_TIMEZONE } from "./club-timezone";

export { CLUB_TIMEZONE };

/**
 * The site's single date parse: a stored UTC instant → Belgian wall-clock, nl
 * locale. Every formatter goes through it — the shared ones below and the
 * route-local ones that render a shape with only one consumer — so a rendered
 * calendar date never depends on where the code runs. Vercel is UTC, the
 * browser is the visitor's own zone, and a client component formats in both: an
 * unpinned late-evening kickoff renders one day on the server and the next
 * after hydration. Offset-less ISO input is read as UTC (the stored contract)
 * rather than the runtime zone.
 *
 * **Not for PSD match dates** — see `toMatchDisplayZone`.
 */
export function toDisplayZone(date: Date | string): DateTime {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date, { zone: "utc" })
      : DateTime.fromJSDate(date);
  return dt.setZone(CLUB_TIMEZONE).setLocale("nl");
}

/**
 * The parse for a PSD match date, which is **not** a true instant. The BFF
 * builds it with `Date.UTC(…)` straight from PSD's Belgian local kickoff
 * string (`apps/api/src/psd/transforms.ts` · `parseDateString`), so the Date's
 * UTC fields already *are* Belgian wall-clock. Reading them off UTC is
 * therefore the pin; putting one through `toDisplayZone` adds a phantom
 * +1/+2h and rolls a ≥22:00 kickoff onto the next day.
 *
 * Two data sources, opposite conventions — check which one you hold before
 * zoning it. Sanity `event` datetimes are real UTC instants (`toDisplayZone`);
 * anything reached through a BFF `Match` is wall-clock (this).
 *
 * `keepLocalTime` carries the wall clock across to the club zone instead of
 * leaving the result sitting in UTC. `toFormat` and `toISODate` read the same
 * either way, but the returned DateTime is now a *correct instant* too — so
 * `toISO()`, `toMillis()` and a comparison against `Date.now()` all mean what
 * they say, which matters the moment one of these feeds an ICS or JSON-LD.
 *
 * Accepts the serialised form as well, because `/kalender` carries its matches
 * as `date.toISOString()` — reading that back through `toDisplayZone` is the
 * same defect one `JSON.stringify` later.
 *
 * **Why this is a docblock and not a branded type.** Weighed and declined in
 * #2601. A brand on `Match.date` in `@kcvv/api-contract` would have to survive
 * the trip to the surface that renders it, and it does not: `ScheduleMatch`,
 * `UpcomingMatch` and `MatchHeroProps` would each have to adopt it,
 * `CalendarMatch` cannot — it carries its date as a `string` — and the very
 * first mapper drops it anyway (`components/match/transform.ts` assigns
 * `date: match.date` straight across, silently widening the brand away). So the
 * brand would guard the one place already holding the invariant and none of the
 * places that lose it. What holds it instead: two differently-*named* parses,
 * formatters named after the source they read, and rule 3 of
 * `src/app/__tests__/cross-page-consistency.test.ts`, which fails any parse
 * that names no zone at all.
 */
export function toMatchDisplayZone(date: Date | string): DateTime {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date, { zone: "utc" })
      : DateTime.fromJSDate(date, { zone: "utc" });
  return dt.setZone(CLUB_TIMEZONE, { keepLocalTime: true }).setLocale("nl");
}

/**
 * Real kickoff instant of a BFF match. Its date is Brussels wall-clock in UTC
 * fields, so a raw `getTime()` runs 1-2 h late against `now` (#3491).
 */
export const kickoffMs = (m: { date: Date | string }): number =>
  toMatchDisplayZone(m.date).toMillis();

/** Today's calendar date in the club's zone — `YYYY-MM-DD`. */
export function clubToday(): string {
  return DateTime.now().setZone(CLUB_TIMEZONE).toISODate()!;
}

/**
 * Brussels midnight of today as a UTC ISO instant (`$dayStart` in the agenda
 * query, #3478). GROQ compares `dateTime`s, so the cut-off is an instant, not
 * the `clubToday()` date string: a date string loses to an all-day event that
 * starts at local midnight. `daysBack` counts club days (not 24 h blocks),
 * so a DST change in between keeps it at midnight.
 */
export function clubDayStart(daysBack = 0): string {
  return DateTime.now()
    .setZone(CLUB_TIMEZONE)
    .startOf("day")
    .minus({ days: daysBack })
    .toUTC()
    .toISO()!;
}

/**
 * Whether a BFF match date falls on the given reference calendar day —
 * the comparison `<MatchStrip>` needs to decide whether today is match day
 * (#2616). Composed from the two zone-aware primitives above rather than a
 * third parse: `toMatchDisplayZone` is the wall-clock read a BFF `Match` date
 * requires (never `toDisplayZone` — that would roll a ≥22:00 kickoff onto the
 * next day, see its docblock), and `clubToday` is "today" read in the same
 * zone, so the two sides of the comparison cannot disagree about which
 * calendar the club is on.
 *
 * `referenceDay` is REQUIRED, deliberately not defaulted to `clubToday()`
 * (#2616 review). The AC calls this "a pure function … over a Match date and
 * a reference calendar day" — a default that reads the wall clock would let
 * `isMatchDay(fixture.date)` compile anywhere, including inside
 * `<MatchStripView>`, whose switch is a client component and whose own docblock
 * explains why that exact read must stay server-side (a client/server date
 * disagreement across a midnight boundary). A required parameter makes that
 * mistake unwritable instead of merely documented; the one extra argument at
 * the one real call site (`<MatchStrip>`) is the cost. The parse this
 * composes is already tested (`toMatchDisplayZone` in this file's test
 * suite, #2601/#2604); this function owns only the equality check.
 *
 * An invalid `matchDate` reads as "not today" rather than throwing —
 * `toMatchDisplayZone(...).toISODate()` is `null` for one, which can never
 * equal a real `referenceDay` string.
 */
export function isMatchDay(
  matchDate: Date | string,
  referenceDay: string,
): boolean {
  return toMatchDisplayZone(matchDate).toISODate() === referenceDay;
}

/**
 * Format date for article display in Belgian Dutch format (e.g., "15 januari 2024")
 * @param date - Date object or ISO string
 */
export const formatArticleDate = (date: Date | string): string => {
  const dt = toDisplayZone(date);
  if (!dt.isValid) return "";
  return dt.toFormat("d MMMM yyyy");
};

/**
 * The widget shape is rendered over both sources — a Sanity datetime, which is
 * an instant, and a BFF match date, which is wall-clock — so it is written once
 * and given one entry point per parse. The fork is at the *parse*, never at the
 * format, so a caller picking the wrong one is picking a wrong *name* rather
 * than passing a silently-off-by-two-hours argument.
 *
 * Locale-pinned through Luxon like every other formatter here — `toLocale*`
 * would resolve the month and weekday names from whatever ICU data the runtime
 * happens to ship, which differs between Node, the browser and CI and would
 * surface as visual-regression drift.
 * `src/app/__tests__/cross-page-consistency.test.ts` holds that ban site-wide.
 */
const widgetShape = (dt: DateTime): string =>
  dt.isValid ? capitalize(dt.toFormat("ccc d MMMM")) : "";

/**
 * Format date in compact widget format (e.g., "Za 22 maart")
 * Uses abbreviated weekday with capitalised first letter, no year.
 */
export const formatWidgetDate = (date: Date | string): string =>
  widgetShape(toDisplayZone(date));

/** Same shape for a BFF match date — see `toMatchDisplayZone`. */
export const formatMatchWidgetDate = (date: Date | string): string =>
  widgetShape(toMatchDisplayZone(date));

/**
 * Compact day + abbreviated month, e.g. `{ day: "3", month: "aug" }`.
 *
 * Match-only, and so not split in two like the widget shape above:
 * `<MatchStrip>`'s date stub is the one surface that renders it, and it renders
 * a fixture. The instant-parse twin was deleted with its last caller (#2601)
 * rather than left standing as the easier import to reach for — the whole
 * defect class this file guards against is a caller picking whichever parse
 * happens to be in scope.
 */
export const formatMatchDayMonth = (
  date: Date | string,
): { day: string; month: string } => {
  const dt = toMatchDisplayZone(date);
  return dt.isValid
    ? { day: dt.toFormat("d"), month: dt.toFormat("MMM") }
    : { day: "", month: "" };
};
