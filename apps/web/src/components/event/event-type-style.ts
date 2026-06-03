import type { Event as SanityEvent } from "@/lib/sanity/sanity.types";

/**
 * Event category. Derived from the generated Sanity `event` schema so adding a
 * new enum value surfaces as a compile error on every `Record<EventType, …>`
 * map below (the tear-off date block + the filter chips) rather than a
 * silently-uncoloured surface.
 */
export type EventType = NonNullable<SanityEvent["eventType"]>;

/**
 * Render-time fallback for events with no `eventType` (PRD §7 — no backfill
 * migration). Type-less events render and filter as "Andere".
 */
export const DEFAULT_EVENT_TYPE: EventType = "Andere";

/**
 * Single source of truth for the per-type fill (background + text colour),
 * shared by `<TicketStub>`'s tear-off date block and `<EventFilterBar>`'s
 * selected chip, so the filter row stays a faithful legend for the tickets it
 * labels (design lock 6e2). The text tone follows the WCAG contrast rule —
 * small text on jersey-deep uses white, not cream. Keeping one map means a
 * category re-tint can never drift the chip out of sync with its ticket.
 */
export const EVENT_TYPE_FILL = {
  Clubevent: "bg-jersey-deep text-white",
  Supportersactiviteit: "bg-warm text-ink",
  Jeugdwerking: "bg-jersey-bright text-ink",
  Andere: "bg-ink text-cream",
} satisfies Record<EventType, string>;
