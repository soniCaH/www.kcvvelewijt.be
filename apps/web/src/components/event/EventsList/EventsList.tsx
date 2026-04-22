import { EventCard, type EventCardProps } from "../EventCard";
import { cn } from "@/lib/utils/cn";

export type EventsListItem = EventCardProps;

export interface EventsListProps {
  events: EventsListItem[];
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

function EventCardSkeleton() {
  return (
    <div className="border-foundation-gray-light flex animate-pulse flex-col overflow-hidden rounded-sm border bg-white shadow-sm">
      <div className="h-48 bg-gray-200" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-2/3 rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function EventsList({
  events,
  emptyMessage = "Geen evenementen gevonden.",
  isLoading = false,
  className,
}: EventsListProps) {
  const gridClasses = cn(
    "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    className,
  );

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-12 text-center text-gray-500",
          className,
        )}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {events.map((event) => (
        <EventCard key={event.href} {...event} />
      ))}
    </div>
  );
}
