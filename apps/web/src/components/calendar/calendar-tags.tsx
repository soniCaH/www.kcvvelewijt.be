/**
 * Kalender row tags (Phase 6.D — #1994).
 *
 * Small mono pills. `EventTypeTag` is shared by the grid's selected-day detail
 * and the agenda event rows; `MatchVenueTag` is the agenda match row's
 * thuis/uit marker (the grid detail renders venue via `<TeamAgendaRow>`'s
 * House/Bus icons, not this pill). Colours map back to the locked vocabulary:
 * matches → `card-red` (Wedstrijden, #1992); events → `EVENT_TYPE_FILL` (the
 * same per-type fill the filter chips + `<TicketStub>` use, so a tag can never
 * drift from the chip that filters it).
 */
import { cn } from "@/lib/utils/cn";
import {
  EVENT_TYPE_FILL,
  type EventType,
} from "@/components/event/event-type-style";

const TAG_BASE =
  "inline-flex shrink-0 items-center border-[1.5px] border-ink px-1.5 py-0.5 " +
  "font-mono text-[9px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap";

/**
 * Type-coloured tag for an event row — the event's category, filled with its
 * locked `EVENT_TYPE_FILL` colour (bg + WCAG-safe text tone baked into the map).
 */
export function EventTypeTag({ eventType }: { eventType: EventType }) {
  return (
    <span
      data-testid="event-type-tag"
      data-event-type={eventType}
      className={cn(TAG_BASE, EVENT_TYPE_FILL[eventType])}
    >
      {eventType}
    </span>
  );
}

/**
 * Thuis / Uit venue tag for a match row — `card-red` filled when KCVV plays at
 * home, an outline pill (transparent) when away. Mirrors the grid cell's
 * filled-vs-ring pip language at row scale.
 */
export function MatchVenueTag({ isHome }: { isHome: boolean }) {
  return (
    <span
      data-testid="match-venue-tag"
      className={cn(
        TAG_BASE,
        isHome ? "bg-card-red text-cream" : "text-ink bg-transparent",
      )}
    >
      {isHome ? "Thuis" : "Uit"}
    </span>
  );
}
