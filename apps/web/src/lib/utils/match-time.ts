import type { MatchDetail } from "@kcvv/api-contract";

/**
 * Returns the match kickoff time as "HH:MM" when available.
 *
 * Prefers the BFF's explicit `time` string; otherwise, if `date` is a full
 * datetime (non-zero hours/minutes), extracts the time from it. PSD sometimes
 * carries the kickoff in the date's time component rather than `time`, so both
 * the match page and the matchPreview/matchRecap hero derive kickoff through
 * this single helper (shared to avoid the two surfaces drifting).
 *
 * @returns The time as `HH:MM` if available, `undefined` otherwise.
 */
export function extractMatchTime(match: MatchDetail): string | undefined {
  if (match.time) {
    return match.time;
  }

  const date = match.date;
  if (date instanceof Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours !== 0 || minutes !== 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
  }

  return undefined;
}
