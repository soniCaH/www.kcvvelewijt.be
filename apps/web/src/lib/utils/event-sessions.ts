import type { EventListItemVM } from "@/lib/repositories/event.repository";

// Its own module: `kalender/utils.ts` reaches client components, and the
// repository module would bring the Sanity client along.
/**
 * One item per session for an item with a per-day schedule, the item itself
 * otherwise (#3906). Each session item gets the id `<id>-<key>`, so the
 * calendar feed mints one UID per session and the site calendar one row.
 */
export const expandSessions = (
  items: readonly EventListItemVM[],
): EventListItemVM[] =>
  items.flatMap(({ sessions, ...item }) =>
    sessions
      ? sessions.map(({ key, dateStart, dateEnd }) => ({
          ...item,
          id: `${item.id}-${key}`,
          dateStart,
          dateEnd,
        }))
      : [item],
  );
