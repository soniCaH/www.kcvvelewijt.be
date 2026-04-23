import { DateTime } from "luxon";
import type { PortableTextBlock } from "@portabletext/react";

/**
 * Normalised client-side shape of an `eventFact` body block. Text fields
 * come through untouched via the `body[]{...}` GROQ spread; the `note`
 * field is a Portable Text block array (single-style, no lists).
 */
/**
 * One day's schedule for a recurring event (steakfestijn, tournament
 * with split days, etc.). When `sessions` is populated on
 * `EventFactValue`, it takes precedence over the top-level `startTime`
 * / `endTime` — each session carries its own hours.
 */
export interface EventFactSession {
  _key?: string;
  /** ISO `YYYY-MM-DD`. */
  date?: string;
  /** `HH:mm`. */
  startTime?: string;
  /** `HH:mm`. */
  endTime?: string;
}

export interface EventFactValue {
  _key?: string;
  _type?: "eventFact";
  title?: string;
  /** ISO `YYYY-MM-DD` — Sanity `date` type projects as a plain string. */
  date?: string;
  /**
   * ISO `YYYY-MM-DD`. Set only for continuous multi-day events (weekend
   * tornooi, school-holiday camp). When absent or equal to `date`, the
   * renderer treats the event as single-day. Ignored when `sessions` is
   * non-empty — the span is then derived from min/max session date.
   */
  endDate?: string;
  /** `HH:mm`. Ignored when `sessions` is non-empty. */
  startTime?: string;
  /** `HH:mm`. Ignored when `sessions` is non-empty. */
  endTime?: string;
  /**
   * Per-day schedules for recurring events (e.g. a steakfestijn with
   * different hours Fri/Sat/Sun). When at least one session has a
   * valid date, the resolver produces a `sessions` result that
   * overrides `date`/`endDate`/`startTime`/`endTime`.
   */
  sessions?: EventFactSession[];
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
 * Resolved session with a guaranteed valid date. `startTime` / `endTime`
 * are kept as raw strings so the renderer can reuse `formatTimeRange`.
 */
export interface ResolvedSession {
  _key?: string;
  date: Extract<ResolvedEvent, { hasDate: true }>;
  startTime?: string;
  endTime?: string;
}

/**
 * Start + end date of an event, discriminated so the strip / overview
 * components can render the right layout without re-checking field
 * presence. Produced by `resolveEventRange`.
 *
 *   - `kind: "none"`     — no valid start date. Callers fall back to
 *                          `Datum volgt`.
 *   - `kind: "single"`   — one valid day (endDate absent or equal to
 *                          date, sessions empty).
 *   - `kind: "range"`    — two distinct valid days, continuous span.
 *                          `sameMonth` + `sameYear` let the renderer
 *                          choose between the compact "25 – 26 APRIL"
 *                          layout and the cross-month "25 APR – 2 MEI"
 *                          fallback.
 *   - `kind: "sessions"` — two or more valid sessions (recurring
 *                          event). Span is derived from min/max
 *                          session date. Each session carries its own
 *                          hours.
 */
export type ResolvedEventRange =
  | { kind: "none" }
  | { kind: "single"; date: Extract<ResolvedEvent, { hasDate: true }> }
  | {
      kind: "range";
      start: Extract<ResolvedEvent, { hasDate: true }>;
      end: Extract<ResolvedEvent, { hasDate: true }>;
      sameMonth: boolean;
      sameYear: boolean;
    }
  | {
      kind: "sessions";
      sessions: ResolvedSession[];
      start: Extract<ResolvedEvent, { hasDate: true }>;
      end: Extract<ResolvedEvent, { hasDate: true }>;
      sameMonth: boolean;
      sameYear: boolean;
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
 * Resolve an event's schedule into a discriminated union the rendering
 * components can switch on.
 *
 * Precedence (first wins):
 *   1. `sessions` with at least one valid date → recurring event. Span
 *      is derived from the min / max session date; `date` / `endDate`
 *      are ignored. A single valid session collapses to `kind: "single"`.
 *   2. `endDate` strictly after `date` → continuous multi-day range.
 *   3. `date` alone (or `endDate` equal/invalid) → `single`.
 *   4. No valid `date` → `kind: "none"`.
 *
 * When the editor inverts `endDate` (ends before start), schema
 * validation blocks publish, but drafts can sneak through — safer to
 * render as `single` using the start date than to reverse the range
 * silently.
 */
export function resolveEventRange(
  startIso?: string,
  endIso?: string,
  sessions?: EventFactSession[],
): ResolvedEventRange {
  // ── 1. Sessions take precedence ─────────────────────────────────
  if (Array.isArray(sessions) && sessions.length > 0) {
    const resolved: ResolvedSession[] = [];
    for (const session of sessions) {
      const d = resolveEventDate(session.date);
      if (!d.hasDate) continue;
      resolved.push({
        _key: session._key,
        date: d,
        startTime: session.startTime?.trim() || undefined,
        endTime: session.endTime?.trim() || undefined,
      });
    }
    if (resolved.length === 0) {
      // Fall through to top-level `date` handling — editor might have
      // added empty session rows but filled `date` as a fallback.
    } else if (resolved.length === 1) {
      return { kind: "single", date: resolved[0].date };
    } else {
      // Sort by ISO date — lexicographic matches chronological for
      // `YYYY-MM-DD` — so the span is deterministic even if the
      // editor entered sessions out of order.
      resolved.sort((a, b) => a.date.dateIso.localeCompare(b.date.dateIso));
      const start = resolved[0].date;
      const end = resolved[resolved.length - 1].date;
      return {
        kind: "sessions",
        sessions: resolved,
        start,
        end,
        sameMonth: start.monthLong === end.monthLong && start.year === end.year,
        sameYear: start.year === end.year,
      };
    }
  }

  // ── 2-4. Fall back to top-level date / endDate ─────────────────
  const start = resolveEventDate(startIso);
  if (!start.hasDate) return { kind: "none" };

  const end = resolveEventDate(endIso);
  if (!end.hasDate || end.dateIso === start.dateIso) {
    return { kind: "single", date: start };
  }
  if (end.dateIso < start.dateIso) {
    return { kind: "single", date: start };
  }

  return {
    kind: "range",
    start,
    end,
    sameMonth: start.monthLong === end.monthLong && start.year === end.year,
    sameYear: start.year === end.year,
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
