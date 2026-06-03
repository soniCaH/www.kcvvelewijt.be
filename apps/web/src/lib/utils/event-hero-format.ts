import type { DateTime } from "luxon";

/**
 * Mono date/location kicker for `<EventHero>` (design lock 6e5 §3.2). Returns
 * the nl-locale, lower-case string — the hero span owns the `uppercase` CSS, so
 * "zaterdag 14 september · 18:00" renders as "ZATERDAG 14 SEPTEMBER · 18:00".
 *
 *  - single-day, timed → `cccc d LLLL · HH:mm` ("zaterdag 14 september · 18:00")
 *  - single-day, all-day (Brussels 00:00) → time omitted ("zaterdag 14 september")
 *  - multi-day → a weekday-stamped day range, never a time:
 *      same month  → "za 14 – zo 15 september"
 *      cross-month → "di 30 september – wo 1 oktober"
 *
 * `start`/`end` are pre-zoned via `parseEventDateTime` (Europe/Brussels).
 */
export function buildEventHeroKicker(
  start: DateTime,
  end: DateTime | null,
): string {
  if (!start.isValid) return "";

  // Only a genuine multi-day span (end on a later day) shows a range; a
  // missing, same-day, or reversed end falls back to the single-day kicker.
  const isMultiDay =
    !!end?.isValid &&
    end.toMillis() > start.toMillis() &&
    !start.hasSame(end, "day");

  if (isMultiDay && end) {
    const sameMonth = start.hasSame(end, "month") && start.hasSame(end, "year");
    const startPart = sameMonth
      ? start.toFormat("ccc d")
      : start.toFormat("ccc d LLLL");
    const endPart = end.toFormat("ccc d LLLL");
    return `${startPart} – ${endPart}`;
  }

  const base = start.toFormat("cccc d LLLL");
  const time = start.toFormat("HH:mm");
  return time !== "00:00" ? `${base} · ${time}` : base;
}

/**
 * The final whitespace-delimited word of an event title, used to drive the
 * `EditorialHeading` italic-jersey-deep emphasis on `<EventHero>` (last-word
 * accent — the #1967 design decision, since `event.title` is a plain string
 * with no accent-word field). Returns `undefined` for an empty / whitespace
 * title so the caller can omit the emphasis prop.
 *
 * Note: `EditorialHeading` matches the emphasis substring with `indexOf`, so a
 * title whose last word repeats earlier (e.g. "Quiz over de Quiz") accents the
 * first occurrence. Acceptable for real event titles; no per-index API exists.
 */
export function accentLastWord(title: string): string | undefined {
  const last = title.trim().split(/\s+/).at(-1);
  return last ? last : undefined;
}
