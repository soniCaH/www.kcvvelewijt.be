import { DateTime } from "luxon";

/**
 * Format date for article display in Belgian Dutch format (e.g., "15 januari 2024")
 * @param date - Date object or ISO string
 */
export const formatArticleDate = (date: Date | string): string => {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return dt.setLocale("nl").toFormat("d MMMM yyyy");
};

/**
 * Format date in compact widget format (e.g., "Za 22 maart")
 * Uses abbreviated weekday with capitalised first letter, no year.
 */
export const formatWidgetDate = (date: Date | string): string => {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  if (!dt.isValid) return "";
  const s = dt.setLocale("nl").toFormat("ccc d MMMM");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
