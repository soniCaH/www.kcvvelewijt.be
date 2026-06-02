import { parseEventDateTime } from "@/lib/utils/event-datetime";

export interface EventMonthGroup<T> {
  /** Stable `yyyy-MM` key for React keys and tests. */
  key: string;
  /**
   * Display-serif month label. Includes the year only when the list spans more
   * than one calendar year (design lock 6e3 year-boundary rule).
   */
  label: string;
  events: T[];
}

const capitalize = (s: string): string =>
  s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/**
 * Group upcoming events into chronological month buckets for the
 * `/evenementen` list. Events are sorted ascending by `dateStart` first, so the
 * helper is order-independent; entries with an unparseable `dateStart` are
 * dropped. Month labels are the capitalised Dutch month name, gaining a year
 * suffix only when the list crosses into another calendar year.
 */
export function groupEventsByMonth<T extends { dateStart: string }>(
  events: T[],
): EventMonthGroup<T>[] {
  const dated = events
    .map((event) => ({
      event,
      dt: parseEventDateTime(event.dateStart),
    }))
    .filter((entry) => entry.dt.isValid)
    .sort((a, b) => a.dt.toMillis() - b.dt.toMillis());

  const spansYears = new Set(dated.map((entry) => entry.dt.year)).size > 1;

  const groups: EventMonthGroup<T>[] = [];
  const byKey = new Map<string, EventMonthGroup<T>>();

  for (const { event, dt } of dated) {
    const key = dt.toFormat("yyyy-MM");
    let group = byKey.get(key);
    if (!group) {
      const month = capitalize(dt.toFormat("MMMM"));
      group = {
        key,
        label: spansYears ? `${month} ${dt.year}` : month,
        events: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.events.push(event);
  }

  return groups;
}
