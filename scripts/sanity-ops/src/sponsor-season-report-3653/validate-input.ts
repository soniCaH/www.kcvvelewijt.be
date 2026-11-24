/**
 * Checks on what the operator passes in (#3653), all pure so the shell can run
 * them before it touches Sanity or GA4.
 */
import type { DateRange } from "./build-report";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written YYYY-MM-DD ("2027-02-30" is not). */
const isRealDate = (date: string) =>
  ISO_DATE.test(date) &&
  new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

export const validateRange = ({ from, to }: DateRange): void => {
  for (const date of [from, to]) {
    if (!isRealDate(date)) {
      throw new Error(`Not a real date in YYYY-MM-DD form: ${date}`);
    }
  }
  if (from > to) throw new Error(`--from ${from} is after --to ${to}.`);
};

/**
 * `{ "Garage X": ["2027-03-01", ...] }`: the Monday of each spotlight week, per
 * Sponsor name, inside the range.
 */
export const parseSpotlightWeeks = (
  text: string,
  { from, to }: DateRange,
): Record<string, string[]> => {
  const parsed: unknown = (() => {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("The spotlight file is not valid JSON.");
    }
  })();
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("The spotlight file must be a JSON object: name to weeks.");
  }
  for (const [name, weeks] of Object.entries(parsed)) {
    if (!Array.isArray(weeks) || !weeks.every((w) => typeof w === "string")) {
      throw new Error(`Spotlight weeks for "${name}" must be a list of dates.`);
    }
    for (const week of weeks as string[]) {
      if (!isRealDate(week)) {
        throw new Error(`"${name}": ${week} is not a real date (YYYY-MM-DD).`);
      }
      if (new Date(`${week}T00:00:00Z`).getUTCDay() !== 1) {
        throw new Error(`"${name}": ${week} is not a Monday.`);
      }
      if (week < from || week > to) {
        throw new Error(
          `"${name}": ${week} is outside the range ${from} to ${to}.`,
        );
      }
    }
  }
  return parsed as Record<string, string[]>;
};
