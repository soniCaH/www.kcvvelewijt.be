import { DateTime } from "luxon";

/**
 * KCVV is in Belgium and Sanity stores `event` datetimes in UTC. Pin all event
 * date/time presentation to Europe/Brussels so the weekday, day, month, start
 * time, and all-day (local-midnight) detection use Belgian wall-clock —
 * independent of the server timezone (Vercel runs UTC). Mirrors the zone
 * pinning already in `FeaturedEventBand` and `kalender/utils`.
 */
export const EVENT_TIMEZONE = "Europe/Brussels";

/**
 * Parse a (UTC) ISO event datetime into a Brussels-zoned, nl-locale DateTime.
 * `{ zone: "utc" }` interprets offset-less inputs as UTC (the stored contract)
 * rather than the runtime-local zone, so the result is environment-independent;
 * for the usual `Z`-suffixed Sanity values the explicit offset already wins, so
 * this is a no-op there.
 */
export function parseEventDateTime(iso: string): DateTime {
  return DateTime.fromISO(iso, { zone: "utc" })
    .setZone(EVENT_TIMEZONE)
    .setLocale("nl");
}
