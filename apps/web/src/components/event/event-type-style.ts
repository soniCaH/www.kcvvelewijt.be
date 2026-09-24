import type { Event as SanityEvent } from "@/lib/sanity/sanity.types";
import type { FilterTab } from "@/components/design-system/FilterTabs";

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
 * shared by `<TicketStub>`'s tear-off date block, the `CalendarMonth`/
 * `CalendarWeek` day chips, `calendar-tags.tsx`'s `<EventTag>`, and
 * `EVENT_TYPE_TABS` below (`/kalender` + `/evenementen`, #2429/#2564 —
 * absorbed the former bespoke `EventFilterBar`/`KalenderFilterBar`), so the
 * filter row stays a faithful legend for the tickets it labels (design lock
 * 6e2). Keeping one map means a category re-tint can never drift the chip
 * out of sync with its ticket. `Clubevent`'s white text is a parked
 * design-system decision, not a WCAG rule — see the comment on it below.
 */
export const EVENT_TYPE_FILL = {
  // Kept white, not cream (#2421 audit): this value feeds <FilterTabs>'s
  // selected "Clubevent" chip below (EVENT_TYPE_TABS.Clubevent.color.fill) —
  // a primitive's selected-state colour, so reconciling it to cream is the
  // FilterTabs/MonoLabel owner's call, not this map's. TicketStub,
  // CalendarMonth/CalendarWeek and calendar-tags.tsx inherit the same white
  // from this one shared value, not because any of them individually needs
  // it — parked alongside the same decision.
  Clubevent: "bg-jersey-deep text-white",
  Supportersactiviteit: "bg-warm text-ink",
  Jeugdwerking: "bg-jersey-bright text-ink",
  Andere: "bg-ink text-cream",
} satisfies Record<EventType, string>;

/**
 * Single source of truth for the per-type `<FilterTabs>` tab config (label +
 * colour), shared by `/kalender`'s `CalendarWidget` and `/evenementen`'s
 * `EventsBrowser` (#2564 review item 1). Was duplicated byte-for-byte in
 * both files, which meant the BORDER half of each facet's colour had no
 * single source of truth even though `EVENT_TYPE_FILL`'s own docblock above
 * promises exactly that. `satisfies Record<EventType, FilterTab>` keeps the
 * exhaustiveness guard: a new `eventType` enum value is a compile error
 * here, not a silently uncoloured chip on one row and not the other.
 * `Alles` and `Andere` carry no colour and render the neutral Direction D
 * chip (`EVENT_TYPE_FILL.Andere`, "bg-ink text-cream", already matches that
 * neutral fill, so an explicit colour on Andere would be a no-op).
 */
export const EVENT_TYPE_TABS = {
  Clubevent: {
    value: "Clubevent",
    label: "Clubevent",
    color: { border: "border-jersey-deep", fill: EVENT_TYPE_FILL.Clubevent },
  },
  Supportersactiviteit: {
    value: "Supportersactiviteit",
    label: "Supportersactiviteit",
    color: {
      border: "border-warm",
      fill: EVENT_TYPE_FILL.Supportersactiviteit,
    },
  },
  Jeugdwerking: {
    value: "Jeugdwerking",
    label: "Jeugdwerking",
    color: {
      border: "border-jersey-bright",
      fill: EVENT_TYPE_FILL.Jeugdwerking,
    },
  },
  Andere: { value: "Andere", label: "Andere" },
} satisfies Record<EventType, FilterTab>;

/**
 * Render order: the four event types in `<TicketStub>` order, derived from
 * the map above so it can't drift out of sync with it. Also the single
 * source of truth for validating a `?type=` URL param in both
 * `CalendarWidget` and `EventsBrowser` (an unknown value falls back to
 * "all").
 */
export const EVENT_TYPE_ORDER = Object.keys(EVENT_TYPE_TABS) as EventType[];
