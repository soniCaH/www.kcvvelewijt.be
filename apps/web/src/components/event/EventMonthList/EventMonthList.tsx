import { EditorialHeading } from "@/components/design-system";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import { TicketStub } from "../TicketStub";
import { groupEventsByMonth } from "./group-events-by-month";

export interface EventMonthListProps {
  /** Upcoming feed items (any order — grouped + sorted chronologically here). */
  events: EventListItemVM[];
}

/**
 * Single-column, month-grouped `/evenementen` list shell (design lock 6e3).
 * Each month is introduced by a display-serif heading, with its events rendered
 * chronologically as `<TicketStub>`. The year appears on a month heading only
 * when the list spans into another calendar year.
 *
 * Lives on the dark `jersey-deep-dark` page (lock 6e §2), so the month heading
 * is cream-toned with a `warm` italic accent — reusing the
 * `/ploegen/[slug]/wedstrijden` month-subtitle accent vocabulary (italic +
 * accent token), applied to the month name since the events list usually
 * carries no year to accent (#2239 EVT-2). The earlier `<StripedSeam>` rule was
 * dropped as overkill here (#2239 EVT-1).
 */
export function EventMonthList({ events }: EventMonthListProps) {
  const groups = groupEventsByMonth(events);

  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section key={group.key}>
          <header className="mb-5">
            <EditorialHeading
              level={2}
              size="display-md"
              tone="cream"
              emphasis={{ text: group.month, tone: "warm" }}
            >
              {group.label}
            </EditorialHeading>
          </header>
          <ul className="flex flex-col gap-4">
            {group.events.map((event) => (
              <li key={event.id}>
                <TicketStub
                  title={event.title}
                  href={event.href}
                  dateStart={event.dateStart}
                  dateEnd={event.dateEnd}
                  eventType={event.eventType}
                  location={event.location}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
