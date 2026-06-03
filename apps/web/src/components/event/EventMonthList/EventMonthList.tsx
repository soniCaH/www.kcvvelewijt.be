import { EditorialHeading, StripedSeam } from "@/components/design-system";
import type { EventVM } from "@/lib/repositories/event.repository";
import { TicketStub } from "../TicketStub";
import { groupEventsByMonth } from "./group-events-by-month";

export interface EventMonthListProps {
  /** Upcoming events (any order — grouped + sorted chronologically here). */
  events: EventVM[];
}

/**
 * Single-column, month-grouped `/evenementen` list shell (design lock 6e3).
 * Each month is introduced by a display-serif heading + `<StripedSeam>` rule,
 * with its events rendered chronologically as `<TicketStub>`. The year appears
 * on a month heading only when the list spans into another calendar year.
 *
 * Lives on the dark `jersey-deep-dark` page (lock 6e §2), so the month heading
 * is cream-toned and the seam uses the `cream-jersey-deep` pair (reads as
 * masking-tape across the dark field) instead of the default ink/cream.
 */
export function EventMonthList({ events }: EventMonthListProps) {
  const groups = groupEventsByMonth(events);

  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section key={group.key}>
          <header className="mb-5">
            <EditorialHeading level={2} size="display-md" tone="cream">
              {group.label}
            </EditorialHeading>
            <StripedSeam height="sm" colorPair="cream-jersey-deep" />
          </header>
          <ul className="flex flex-col gap-4">
            {group.events.map((event) => (
              <li key={event.id}>
                <TicketStub
                  title={event.title}
                  href={`/evenementen/${event.slug}`}
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
