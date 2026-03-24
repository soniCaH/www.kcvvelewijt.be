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
    <div className="flex flex-col overflow-hidden rounded-sm bg-white border border-foundation-gray-light shadow-sm animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
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
          "flex items-center justify-center py-12 text-gray-500 text-center",
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
