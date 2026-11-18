/**
 * The `/kalender` query param that opens the subscribe panel with one Team
 * picked (#3788). Its own module, not `CalendarWidget.tsx`: that file is a
 * client component, and the server pages that name the param would import a
 * client reference instead of the string.
 */
export const KALENDER_ABONNEER_PARAM = "abonneer";
