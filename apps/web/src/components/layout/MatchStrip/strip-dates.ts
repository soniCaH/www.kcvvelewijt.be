import { formatMatchDayMonth, formatMatchWidgetDate } from "@/lib/utils/dates";
import type { ScheduleRow } from "@/components/match/types";

/**
 * The strings `<MatchStripView>` prints for one row's date. Formatted on the
 * server by `<MatchStrip>` (#3480) so the view — and the browser — never loads
 * Luxon for them.
 */
export interface StripDates {
  /** `Za 22 maart` — the aria-labels and the desktop slide's meta line. */
  widget: string;
  /** `22` — the mobile stub's day-of-month. */
  day: string;
  /** `mrt` — the mobile stub's abbreviated month. */
  month: string;
}

/** Placeholder for an absent row: nothing renders it, but the shape stays total. */
const NO_DATES: StripDates = { widget: "", day: "", month: "" };

/**
 * A BFF match date is Brussels wall-clock in UTC fields, so both formatters
 * read it through `toMatchDisplayZone` — never `toDisplayZone`, which would
 * push a late kickoff onto the next day.
 */
export function stripDates(row: ScheduleRow | null): StripDates {
  if (!row) return NO_DATES;
  return {
    widget: formatMatchWidgetDate(row.date),
    ...formatMatchDayMonth(row.date),
  };
}
