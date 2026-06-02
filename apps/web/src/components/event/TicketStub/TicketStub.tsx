import Link from "next/link";
import { DateTime } from "luxon";
import type { Event as SanityEvent } from "@/lib/sanity/sanity.types";
import { MonoLabel } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";

/**
 * Event category. Derived from the generated Sanity `event` schema so adding a
 * new enum value surfaces as a compile error on `DATE_BLOCK_CLASS` below rather
 * than a silently-uncoloured date block.
 */
export type EventType = NonNullable<SanityEvent["eventType"]>;

export interface TicketStubProps {
  /** Event title — the display-serif headline of the stub. */
  title: string;
  /** Whole-stub link target (e.g. `/evenementen/[slug]`). */
  href: string;
  /** ISO datetime of the event start; drives the tear-off date block. */
  dateStart: string;
  /**
   * Event category. Drives the date-block colour code. A missing / `null`
   * value renders as "Andere" — the PRD §7 render-time fallback, so existing
   * events without a type need no backfill migration.
   */
  eventType?: EventType | null;
  /** Where the event happens; shown in the mono meta line when present. */
  location?: string | null;
}

const DEFAULT_EVENT_TYPE: EventType = "Andere";

// Tear-off date-block colour per eventType (design lock 6e2). The 2px ink
// ticket border frames every colour, and the text tone follows the WCAG
// contrast rule (small text on jersey-deep uses white, not cream).
const DATE_BLOCK_CLASS: Record<EventType, string> = {
  Clubevent: "bg-jersey-deep text-white",
  Supportersactiviteit: "bg-warm text-ink",
  Jeugdwerking: "bg-jersey-bright text-ink",
  Andere: "bg-ink text-cream",
};

const MONO_LABEL_CLASS =
  "font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)]";

// Date parts for the tear-off block, formatted with Luxon to match the rest of
// the app (see `lib/utils/dates.ts`). `isValid` guards the `coalesce(.., "")`
// projection so a cleared `dateStart` renders blank rather than "Invalid Date";
// the locale's trailing period on abbreviated months is dropped.
function eventDateParts(dateStart: string): {
  weekday: string;
  day: string;
  month: string;
} {
  const dt = DateTime.fromISO(dateStart).setLocale("nl");
  if (!dt.isValid) return { weekday: "", day: "", month: "" };
  return {
    weekday: dt.toFormat("ccc"),
    day: dt.toFormat("d"),
    month: dt.toFormat("MMM").replace(/\.$/, ""),
  };
}

/**
 * Bare events-list ticket (tracer #1964). Renders a type-coloured tear-off
 * date block + eventType pill + title + location as a single whole-stub link.
 * Month grouping, the hover tilt / "Meer details" reveal, and the time meta
 * are finalised in #1965 (Phase 2).
 */
export function TicketStub({
  title,
  href,
  dateStart,
  eventType,
  location,
}: TicketStubProps) {
  const type = eventType ?? DEFAULT_EVENT_TYPE;
  const { weekday, day, month } = eventDateParts(dateStart);
  const trimmedLocation = location?.trim();

  return (
    <Link
      href={href}
      className="group border-ink bg-cream text-ink shadow-paper-sm focus-visible:outline-jersey-deep flex border-2 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div
        data-testid="ticket-stub-date"
        data-event-type={type}
        className={cn(
          "border-ink flex shrink-0 flex-col items-center justify-center border-r-2 border-dashed px-4 py-3 text-center uppercase",
          DATE_BLOCK_CLASS[type],
        )}
      >
        <span className={MONO_LABEL_CLASS}>{weekday}</span>
        <span className="font-display text-3xl leading-none font-bold">
          {day}
        </span>
        <span className={MONO_LABEL_CLASS}>{month}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-1 px-4 py-3">
        <MonoLabel variant="pill-ink" size="sm">
          {type}
        </MonoLabel>
        <span className="font-display text-xl leading-tight font-bold">
          {title}
        </span>
        {trimmedLocation && (
          <span
            data-testid="ticket-stub-meta"
            className={cn(MONO_LABEL_CLASS, "text-ink-muted")}
          >
            {trimmedLocation}
          </span>
        )}
      </div>
    </Link>
  );
}
