import { cn } from "@/lib/utils/cn";
import { EVENT_TYPE_FILL, type EventType } from "../event-type-style";

/** Filter selection: a specific event type, or `"all"` (the default — no filter). */
export type EventFilterValue = EventType | "all";

interface ChipStyle {
  /** Filled state — the selected chip carries its type colour. */
  selected: string;
  /**
   * Resting state — a dimmed outline that still reads against the dark field,
   * so the row doubles as the colour legend (no separate legend). The chip's
   * text label always names the type, so colour is never the sole signal
   * (WCAG 1.4.1).
   */
  unselected: string;
}

// Dimmed cream resting outline for the chips that carry no distinguishable
// resting colour: "Alles" (the neutral reset) and "Andere" (whose ink fill
// reads as black-on-dark-green, so an ink outline would be invisible at rest).
const NEUTRAL_OUTLINE = "border-cream/40 text-cream/80 hover:bg-cream/10";

// Keyed by `EventType` so a new schema enum value is a compile error here (the
// Record requires every key) rather than a silently missing chip. The selected
// fill is pulled from the shared `EVENT_TYPE_FILL` map — the same colours
// `<TicketStub>`'s date block uses — so the chip can never drift out of sync
// with the ticket it labels. The matching border + the dark-field resting
// outline are chip-only, so they live here.
const TYPE_CHIP_STYLE = {
  Clubevent: {
    selected: `${EVENT_TYPE_FILL.Clubevent} border-jersey-deep`,
    unselected: "border-jersey-deep text-cream hover:bg-jersey-deep/10",
  },
  Supportersactiviteit: {
    selected: `${EVENT_TYPE_FILL.Supportersactiviteit} border-warm`,
    unselected: "border-warm text-cream hover:bg-warm/10",
  },
  Jeugdwerking: {
    selected: `${EVENT_TYPE_FILL.Jeugdwerking} border-jersey-bright`,
    unselected: "border-jersey-bright text-cream hover:bg-jersey-bright/10",
  },
  Andere: {
    selected: `${EVENT_TYPE_FILL.Andere} border-ink`,
    unselected: NEUTRAL_OUTLINE,
  },
} satisfies Record<EventType, ChipStyle>;

// "Alles" is the neutral no-filter default — it carries no type colour, so it
// is cream-filled when selected and the shared neutral outline at rest.
const ALL_CHIP_STYLE: ChipStyle = {
  selected: "bg-cream text-ink border-cream",
  unselected: NEUTRAL_OUTLINE,
};

// Render order: the reset chip first, then the four types in `<TicketStub>`
// order. Derived from the style map so it can never drift out of sync with it.
const TYPE_ORDER = Object.keys(TYPE_CHIP_STYLE) as EventType[];

/**
 * Shared chip shape (also used by the `/evenementen` filtered-to-zero reset
 * button), so the pills stay visually identical across the surface.
 */
export const EVENT_CHIP_BASE =
  "inline-flex items-center rounded-full border-2 px-3.5 py-1.5 font-mono font-medium uppercase " +
  "text-[length:var(--text-label)] tracking-[var(--text-label--tracking)] " +
  "cursor-pointer transition-colors duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream";

export interface EventFilterBarProps {
  /** Currently-selected filter (`"all"` = no filter). */
  selected: EventFilterValue;
  /**
   * Fired when a chip is pressed — including re-pressing the active chip. The
   * consumer owns the dedup guard so a no-op reselection never double-fires
   * state or analytics.
   */
  onSelect: (value: EventFilterValue) => void;
}

/**
 * Colour-coded single-select filter chips for `/evenementen` (design lock 6e
 * §2). The row doubles as the legend: every chip's colour shows at rest via its
 * outline and fills on selection. Built for the dark `jersey-deep-dark` page,
 * so resting text + outlines are cream-toned.
 */
export function EventFilterBar({ selected, onSelect }: EventFilterBarProps) {
  const renderChip = (
    value: EventFilterValue,
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
      aria-label="Filter evenementen op type"
      className="flex flex-wrap gap-2"
    >
      {renderChip("all", "Alles", ALL_CHIP_STYLE)}
      {TYPE_ORDER.map((type) => renderChip(type, type, TYPE_CHIP_STYLE[type]))}
    </div>
  );
}
