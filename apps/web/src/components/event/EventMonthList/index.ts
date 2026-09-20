export { EventMonthList, type EventMonthListProps } from "./EventMonthList";
// `groupEventsByMonth` is deliberately NOT re-exported here: its only
// consumers (EventMonthList.tsx, group-events-by-month.test.ts) import it
// directly from "./group-events-by-month".
export type { EventMonthGroup } from "./group-events-by-month";
