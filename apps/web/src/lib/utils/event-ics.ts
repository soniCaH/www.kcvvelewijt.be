import { DateTime } from "luxon";
import { resolveEventDateRange } from "./event-datetime";

export interface EventIcsInput {
  /** Stable iCal UID, caller-supplied — see `buildEventUid` (`event-uid.ts`). */
  uid: string;
  title: string;
  /** ISO datetime of the event start (UTC, as stored in Sanity). */
  dateStart: string;
  /** ISO datetime of the event end; drives DTEND when present. */
  dateEnd?: string | null;
  location?: string | null;
  description?: string | null;
  url?: string | null;
  /** ISO timestamp for DTSTAMP — pass `new Date().toISOString()` at the call site. */
  now: string;
}

/** RFC 5545 §3.3.11 text escaping: backslash first, then `;`, `,`, newlines. */
const escapeText = (value: string): string => {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
};

/** UTC basic format with the trailing `Z` — `20260912T160000Z`. */
const toUtcStamp = (iso: string): string => {
  return DateTime.fromISO(iso, { zone: "utc" }).toFormat(
    "yyyyLLdd'T'HHmmss'Z'",
  );
};

const encoder = new TextEncoder();

/**
 * RFC 5545 §3.1 content-line folding: a line longer than 75 octets is split,
 * with each continuation line prefixed by a single space. Counts UTF-8 octets
 * and folds on code-point boundaries so a multi-byte character is never split.
 * Matters for the URL-bearing `URL:` / `DESCRIPTION:` lines (the canonical event
 * URL alone pushes them past 75 octets).
 */
const foldLine = (line: string): string => {
  if (encoder.encode(line).length <= 75) return line;

  const { lines, current } = [...line].reduce<{
    lines: string[];
    current: string;
    octets: number;
  }>(
    (acc, ch) => {
      const chOctets = encoder.encode(ch).length;
      // First physical line gets the full 75; continuation lines reserve one
      // octet for the leading space, so their content budget is 74.
      const budget = acc.lines.length === 0 ? 75 : 74;
      return acc.octets + chOctets > budget
        ? { lines: [...acc.lines, acc.current], current: ch, octets: chOctets }
        : {
            ...acc,
            current: acc.current + ch,
            octets: acc.octets + chOctets,
          };
    },
    { lines: [], current: "", octets: 0 },
  );
  return (current ? [...lines, current] : lines).join("\r\n ");
};

/**
 * Build a single-VEVENT `.ics` document (string) for the "Zet in agenda" CTA on
 * `/evenementen/[slug]` (design lock 6e5 §3.5 — client-side blob, no BFF).
 *
 * Brussels-midnight events (`00:00` local start, and an end that is also
 * midnight or absent) are emitted as all-day `VALUE=DATE` events with an
 * exclusive next-day `DTEND` — the same all-day rule `<TicketStub>` uses to
 * drop the time. Timed events use UTC `DTSTART`/`DTEND`; a timed event with no
 * end omits `DTEND` rather than fabricating a duration.
 *
 * Content lines are folded at 75 octets (RFC 5545 §3.1) and CRLF-joined.
 */
export const buildEventIcs = (input: EventIcsInput): string => {
  const { isAllDay, start, allDayEndExclusive } = resolveEventDateRange(
    input.dateStart,
    input.dateEnd,
  );

  const dateLines: string[] = [];
  if (isAllDay) {
    dateLines.push(`DTSTART;VALUE=DATE:${start.toFormat("yyyyLLdd")}`);
    dateLines.push(
      `DTEND;VALUE=DATE:${allDayEndExclusive.toFormat("yyyyLLdd")}`,
    );
  } else {
    dateLines.push(`DTSTART:${toUtcStamp(input.dateStart)}`);
    if (input.dateEnd) dateLines.push(`DTEND:${toUtcStamp(input.dateEnd)}`);
  }

  const location = input.location?.trim();
  const description = input.description?.trim();
  const url = input.url?.trim();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KCVV Elewijt//Evenementen//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${toUtcStamp(input.now)}`,
    ...dateLines,
    `SUMMARY:${escapeText(input.title)}`,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    ...(url ? [`URL:${escapeText(url)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join("\r\n");
};
