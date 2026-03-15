import { DateTime } from "luxon";

/**
 * Format date using Luxon (matching Gatsby site patterns)
 * @param date - Date object or ISO string
 * @param format - Luxon format string (default: 'dd/MM/yyyy')
 */
export const formatDate = (
  date: Date | string,
  format: string = "dd/MM/yyyy",
): string => {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return dt.setLocale("nl").toFormat(format);
};

/**
 * Format date and time
 * @param date - Date object or ISO string
 */
export const formatDateTime = (date: Date | string): string => {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return dt.setLocale("nl").toFormat("dd/MM/yyyy HH:mm");
};

/**
 * Format date relative to now (e.g., "2 days ago")
 * @param date - Date object or ISO string
 */
export const formatRelative = (date: Date | string): string => {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return dt.setLocale("nl").toRelative() || "";
};

/**
 * Format date in long format (e.g., "maandag 12 januari 2025")
 * @param date - Date object or ISO string
 */
export const formatLongDate = (date: Date | string): string => {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return dt.setLocale("nl").toFormat("cccc d MMMM yyyy");
};

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
 * Format date for match display (e.g., "zaterdag 15 januari")
 * @param date - Date object or ISO string
 */
export const formatMatchDate = (date: Date | string): string => {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return dt.setLocale("nl").toFormat("cccc d MMMM");
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
  const s = dt.setLocale("nl").toFormat("ccc d MMMM");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Format time for match display (e.g., "15:00")
 * @param date - Date object or ISO string
 */
export const formatMatchTime = (date: Date | string): string => {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return dt.setLocale("nl").toFormat("HH:mm");
};
