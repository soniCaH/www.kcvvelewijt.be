"use client";

import { useState } from "react";

import { trackEvent } from "@/lib/analytics/track-event";
import { MonoLabel } from "@/components/design-system";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import { EventMonthList } from "../EventMonthList";
import {
  EventFilterBar,
  EVENT_CHIP_BASE,
  type EventFilterValue,
} from "../EventFilterBar";
import { DEFAULT_EVENT_TYPE } from "../event-type-style";
import { cn } from "@/lib/utils/cn";

export interface EventsBrowserProps {
  /**
   * Merged upcoming feed — `event` docs + `articleType:event` articles, already
   * filtered upcoming-only + sorted chronologically by the repo.
   */
  events: EventListItemVM[];
  /**
   * Seeds the selected filter — for tests / Storybook state-coverage stories
   * (e.g. the filtered-to-zero state). Production always starts at `"all"`.
   */
  initialSelected?: EventFilterValue;
}

/**
 * Client shell for the `/evenementen` list (design lock 6e §2 + §4): the
 * colour-coded filter chips above the month-grouped `<TicketStub>` list, plus
 * the empty / filtered-to-zero states. Single-select, "Alles" default, on the
 * dark `jersey-deep-dark` page.
 *
 * - No upcoming events at all → centred message, **no** filter row.
 * - A type with no upcoming events → per-category message + a "Toon alles"
 *   reset, with the filter row kept visible.
 *
 * Months whose tickets are all filtered out drop their header automatically —
 * `groupEventsByMonth` only buckets the events `<EventMonthList>` receives.
 */
export function EventsBrowser({
  events,
  initialSelected = "all",
}: EventsBrowserProps) {
  const [selected, setSelected] = useState<EventFilterValue>(initialSelected);

  // Dedup guard: re-pressing the active chip is a no-op, so neither state nor
  // analytics fire twice for the same selection (repo analytics policy).
  const handleSelect = (value: EventFilterValue) => {
    if (value === selected) return;
    setSelected(value);
    trackEvent("event_filter", { event_type: value });
  };

  // No events at all: empty-list state — no filter row, no month headers.
  if (events.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <MonoLabel tone="cream">Agenda</MonoLabel>
        <p className="font-display text-cream text-2xl">
          Geen evenementen gepland — kom snel terug.
        </p>
      </div>
    );
  }

  const filtered =
    selected === "all"
      ? events
      : events.filter(
          (event) => (event.eventType ?? DEFAULT_EVENT_TYPE) === selected,
        );

  return (
    <div className="flex flex-col gap-8">
      <EventFilterBar selected={selected} onSelect={handleSelect} />

      {filtered.length === 0 ? (
        // role="status" (implicit aria-live="polite") so the per-category
        // message is announced when a filter selection empties the list — it
        // appears on a client-side state change, not a page load.
        <div
          role="status"
          className="flex flex-col items-center gap-5 py-12 text-center"
        >
          <p className="font-display text-cream text-2xl">
            Geen evenementen in de categorie {selected} gepland.
          </p>
          <button
            type="button"
            onClick={() => handleSelect("all")}
            className={cn(
              EVENT_CHIP_BASE,
              "border-cream text-cream hover:bg-cream/10",
            )}
          >
            Toon alles
          </button>
        </div>
      ) : (
        <EventMonthList events={filtered} />
      )}
    </div>
  );
}
