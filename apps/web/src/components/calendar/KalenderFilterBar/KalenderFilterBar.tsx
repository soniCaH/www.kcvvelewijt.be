"use client";

import { cn } from "@/lib/utils/cn";
import { EVENT_CHIP_BASE } from "@/components/event/EventFilterBar";
import {
  EVENT_TYPE_FILL,
  type EventType,
} from "@/components/event/event-type-style";
import type { KalenderType } from "@/app/(main)/kalender/utils";

/** Filter selection: a specific kalender type, or `"all"` (the default — no filter). */
export type KalenderFilterValue = KalenderType | "all";

interface ChipStyle {
  /** Filled state — the selected chip carries its category colour. */
  selected: string;
  /** Resting state — a colour outline + ink text that reads on the light field. */
  unselected: string;
}

/**
 * `Wedstrijden` (matches) — the primary calendar category. Owner-locked to the
 * `card-red` token (#1992), repurposing the Phase 6.B alert tint as the match
 * facet fill so it reads as the boldest chip in the row.
 */
const WEDSTRIJDEN_CHIP_STYLE: ChipStyle = {
  selected: "bg-card-red text-cream border-card-red",
  unselected: "border-card-red text-ink hover:bg-card-red/10",
};

/**
 * The four event categories. The selected fill is pulled from the shared
 * `EVENT_TYPE_FILL` map — the same colours `<TicketStub>` + `<EventFilterBar>`
 * use — so a calendar chip can never drift from the ticket it labels. Resting
 * styles are ink-toned for the light `/kalender` field (vs `<EventFilterBar>`'s
 * cream tones for the dark `/evenementen` field); the dark/light reconcile is
 * provisional pending the Phase 3 design gate (#1993).
 */
const EVENT_TYPE_CHIP_STYLE = {
  Clubevent: {
    selected: `${EVENT_TYPE_FILL.Clubevent} border-jersey-deep`,
    unselected: "border-jersey-deep text-ink hover:bg-jersey-deep/10",
  },
  Supportersactiviteit: {
    selected: `${EVENT_TYPE_FILL.Supportersactiviteit} border-warm`,
    unselected: "border-warm text-ink hover:bg-warm/10",
  },
  Jeugdwerking: {
    selected: `${EVENT_TYPE_FILL.Jeugdwerking} border-jersey-bright`,
    unselected: "border-jersey-bright text-ink hover:bg-jersey-bright/10",
  },
  Andere: {
    selected: `${EVENT_TYPE_FILL.Andere} border-ink`,
    unselected: "border-ink/60 text-ink hover:bg-ink/5",
  },
} satisfies Record<EventType, ChipStyle>;

/** "Alles" — the neutral no-filter reset; ink-filled when active on the light field. */
const ALL_CHIP_STYLE: ChipStyle = {
  selected: "bg-ink text-cream border-ink",
  unselected: "border-ink/40 text-ink hover:bg-ink/5",
};

// Render order after the reset + matches chips: the four event types in
// `<TicketStub>` order. Derived from the style map so it can't drift out of sync.
const EVENT_TYPE_ORDER = Object.keys(EVENT_TYPE_CHIP_STYLE) as EventType[];

/** Every valid filter value, in render order — the single source of truth for
 *  validating a `?type=` URL param (an unknown value falls back to `"all"`). */
const KALENDER_FILTER_VALUES: readonly KalenderFilterValue[] = [
  "all",
  "Wedstrijden",
  ...EVENT_TYPE_ORDER,
];

/** Type guard: is `value` a renderable filter facet? Narrows a raw URL param. */
export function isKalenderFilterValue(
  value: string | null,
): value is KalenderFilterValue {
  return (
    value !== null &&
    (KALENDER_FILTER_VALUES as readonly string[]).includes(value)
  );
}

export interface KalenderFilterBarProps {
  /** Currently-selected filter (`"all"` = no filter). */
  selected: KalenderFilterValue;
  /**
   * Fired when a chip is pressed — including re-pressing the active chip. The
   * consumer owns the dedup guard so a no-op reselection never double-fires
   * state, navigation, or analytics.
   */
  onSelect: (value: KalenderFilterValue) => void;
}

/**
 * Colour-coded by-type filter chips for `/kalender` (Phase 6.D Phase 2, #1992).
 * Reuses `/evenementen`'s chip vocabulary — the `EVENT_CHIP_BASE` pill shape +
 * `EVENT_TYPE_FILL` colours — extended with a `Wedstrijden` chip for matches, so
 * the filter row doubles as a colour legend. Single-select, "Alles" default. The
 * locked set: `Alles · Wedstrijden · Clubevent · Supportersactiviteit ·
 * Jeugdwerking · Andere`. Final field/visual is locked at the Phase 3 gate (#1993).
 */
export function KalenderFilterBar({
  selected,
  onSelect,
}: KalenderFilterBarProps) {
  const renderChip = (
    value: KalenderFilterValue,
    label: string,
    style: ChipStyle,
  ) => {
    const isSelected = selected === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(value)}
        className={cn(
          EVENT_CHIP_BASE,
          // Light-field focus ring — EVENT_CHIP_BASE's cream ring is tuned for
          // the dark /evenementen field; twMerge lets this ink ring win.
          "focus-visible:outline-ink",
          isSelected ? style.selected : style.unselected,
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label="Filter kalender op type"
      className="flex flex-wrap gap-2"
    >
      {renderChip("all", "Alles", ALL_CHIP_STYLE)}
      {renderChip("Wedstrijden", "Wedstrijden", WEDSTRIJDEN_CHIP_STYLE)}
      {EVENT_TYPE_ORDER.map((type) =>
        renderChip(type, type, EVENT_TYPE_CHIP_STYLE[type]),
      )}
    </div>
  );
}
