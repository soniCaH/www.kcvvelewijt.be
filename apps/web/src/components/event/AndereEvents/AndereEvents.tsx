import { EditorialHeading, StripedSeam } from "@/components/design-system";
import type { EventVM } from "@/lib/repositories/event.repository";
import { TicketStub } from "../TicketStub";

export interface AndereEventsProps {
  /** Other upcoming events (the current event already excluded by the caller). */
  events: EventVM[];
}

/**
 * "Andere events" section below `<EventHero>` on `/evenementen/[slug]` (design
 * lock 6e5 §"Below the hero"): a `<StripedSeam>` heading + a single column of
 * the locked `<TicketStub>` for the other upcoming events — full-width to match
 * the main list (a 2-up grid squashed the date-block + title). Renders nothing
 * when there are none (the caller passes an already-filtered list).
 */
export function AndereEvents({ events }: AndereEventsProps) {
  if (events.length === 0) return null;

  return (
    <section className="mt-16">
      <header className="mb-5">
        <EditorialHeading level={2} size="display-md">
          Andere events
        </EditorialHeading>
        <StripedSeam height="sm" colorPair="ink-cream" />
      </header>
      <ul className="flex flex-col gap-4">
        {events.map((event) => (
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
  );
}
