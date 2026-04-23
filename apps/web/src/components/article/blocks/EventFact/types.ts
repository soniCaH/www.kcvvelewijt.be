import { DateTime } from "luxon";
import type { PortableTextBlock } from "@portabletext/react";

/**
 * Normalised client-side shape of an `eventFact` body block. Text fields
 * come through untouched via the `body[]{...}` GROQ spread; the `note`
 * field is a Portable Text block array (single-style, no lists).
 */
export interface EventFactValue {
  _key?: string;
  _type?: "eventFact";
  title?: string;
  /** ISO `YYYY-MM-DD` — Sanity `date` type projects as a plain string. */
  date?: string;
  /** `HH:mm` — optional. */
  startTime?: string;
  /** `HH:mm` — optional. */
  endTime?: string;
  location?: string;
  address?: string;
  /** Free-text age-group label, e.g. `U13`, `Senioren`. */
  ageGroup?: string;
  /** Free-text competition tag, e.g. `Tornooi`, `Clubfeest`. */
  competitionTag?: string;
  /** Optional CTA URL — when absent, CTA is hidden. */
  ticketUrl?: string;
  /** Defaults to `Inschrijven` when absent. */
  ticketLabel?: string;
  capacity?: number;
  note?: PortableTextBlock[];
}

/**
 * Result of resolving an `eventFact` to renderable parts. Discriminated
 * by `hasDate` so the strip / feature / overview components can rely on
 * the compiler to know the date-block parts are present.
 */
export type ResolvedEvent =
  | {
      hasDate: true;
      day: string;
      monthShort: string;
      monthLong: string;
      year: string;
      weekday: string;
      dateIso: string;
    }
  | {
      hasDate: false;
    };

/**
 * Parse an ISO `YYYY-MM-DD` date into renderable Dutch parts. Returns
 * `{ hasDate: false }` when the input is missing, empty, malformed, OR
 * out of range (e.g. `2027-02-29` on a non-leap year) — `DateTime.isValid`
 * catches the silent-rollover that `new Date(Date.UTC(…))` would miss.
 *
 * Luxon is the established date stack site-wide (`lib/utils/dates.ts`);
 * reusing it keeps Dutch locale rendering + validation in one place
 * rather than maintaining a second Dutch weekday/month table.
 */
export function resolveEventDate(iso?: string): ResolvedEvent {
  if (!iso || typeof iso !== "string") return { hasDate: false };
  const dt = DateTime.fromISO(iso.trim(), { zone: "utc" }).setLocale("nl");
  if (!dt.isValid) return { hasDate: false };
  return {
    hasDate: true,
    day: dt.toFormat("d"),
    monthShort: dt.toFormat("LLL"),
    monthLong: dt.toFormat("MMMM"),
    year: dt.toFormat("yyyy"),
    weekday: dt.toFormat("cccc"),
    dateIso: iso,
  };
}

/**
 * Format the time range for an event row. Returns:
 *   - `"10:00 - 17:00"` when both ends are present
 *   - `"10:00"` when only `startTime` is set
 *   - `undefined` when nothing is set (so the caller can skip the slot)
 */
export function formatTimeRange(
  startTime?: string,
  endTime?: string,
): string | undefined {
  const start = startTime?.trim();
  const end = endTime?.trim();
  if (!start && !end) return undefined;
  if (start && end) return `${start} - ${end}`;
  return start ?? end;
}

export const DEFAULT_TICKET_LABEL = "Inschrijven";
