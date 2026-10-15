/**
 * A BFF match date is Brussels wall-clock stored in UTC fields (`parseDateString`
 * in `transforms.ts`, #2601), so its `getTime()` is 1 h (winter) or 2 h (summer)
 * LATER than the real kickoff. Convert at the comparison, never on the wire:
 * cached KV entries would misdecode (#3491). No Luxon in the Worker — Intl only.
 */
const brusselsParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Brussels",
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/** Brussels UTC offset (ms) at a real instant: +1 h winter, +2 h summer. */
function brusselsOffsetMs(instantMs: number): number {
  const secondMs = Math.floor(instantMs / 1000) * 1000;
  const p: Record<string, number> = {};
  for (const { type, value } of brusselsParts.formatToParts(secondMs)) {
    p[type] = Number(value);
  }
  return (
    Date.UTC(p.year!, p.month! - 1, p.day!, p.hour, p.minute, p.second) -
    secondMs
  );
}

/**
 * Real epoch ms for a Brussels wall-clock-as-UTC value. Two passes: the first
 * offset is read at the wall value (off by up to 2 h), the second at the
 * corrected instant — right on both DST-change days for any non-night kickoff.
 */
export function wallClockToInstantMs(wallMs: number): number {
  return wallMs - brusselsOffsetMs(wallMs - brusselsOffsetMs(wallMs));
}

/** Real kickoff instant of a BFF match date (a `Date` or its ISO string). */
export function kickoffMs(date: Date | string): number {
  return wallClockToInstantMs(new Date(date).getTime());
}

/** Real instant of 00:00 Brussels on the Brussels calendar day of `nowMs`. */
export function startOfBrusselsDayMs(nowMs: number): number {
  const wallMs = nowMs + brusselsOffsetMs(nowMs);
  return wallClockToInstantMs(
    wallMs - (((wallMs % 86_400_000) + 86_400_000) % 86_400_000),
  );
}
