import type { MatchDetail } from "@kcvv/api-contract";
import { toMatchDisplayZone } from "./dates";

/**
 * Returns the match kickoff time as "HH:MM" when available.
 *
 * Prefers the BFF's explicit `time` string; otherwise, if `date` is a full
 * datetime (non-zero hours/minutes), extracts the time from it. PSD sometimes
 * carries the kickoff in the date's time component rather than `time`, so both
 * the match page and the matchPreview/matchRecap hero derive kickoff through
 * this single helper (shared to avoid the two surfaces drifting).
 *
 * The read goes through `toMatchDisplayZone` rather than `getHours()`, which
 * takes the *runtime* zone: right on Vercel by accident, two hours out on a
 * Belgian dev machine, and — worse — turning a timeless fixture's midnight into
 * a "02:00" kickoff the club never announced. Rule 3 of the cross-page guard
 * cannot see this one, because it is not a Luxon call at all (#2601).
 *
 * @returns The time as `HH:MM` if available, `undefined` otherwise.
 */
export const extractMatchTime = (match: MatchDetail): string | undefined => {
  if (match.time) {
    return match.time;
  }

  const date = match.date;
  if (date instanceof Date) {
    const dt = toMatchDisplayZone(date);
    // An invalid date used to fall through to `"NaN:NaN"`; it now reads as no
    // kickoff, which is what an unparseable one means.
    if (!dt.isValid) return undefined;
    const time = dt.toFormat("HH:mm");
    if (time !== "00:00") return time;
  }

  return undefined;
};
