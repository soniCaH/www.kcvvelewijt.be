/**
 * Not a date formatter — it joins two already-formatted `HH:mm` strings, with no
 * parse, locale or zone, so the club-zone rule does not reach it. It lives here
 * rather than in `./types.ts` because a types module is not a home for
 * behaviour (#2430).
 *
 * Format the time range for an event row. Returns:
 *   - `"10:00 - 17:00"` when both ends are present
 *   - `"10:00"` when only `startTime` is set
 *   - `undefined` when nothing is set (so the caller can skip the slot)
 */
export const formatTimeRange = (
  startTime?: string,
  endTime?: string,
): string | undefined => {
  const start = startTime?.trim();
  const end = endTime?.trim();
  if (!start && !end) return undefined;
  if (start && end) return `${start} - ${end}`;
  return start ?? end;
};
