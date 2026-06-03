import Link from "next/link";
import type { DateTime } from "luxon";
import type { Event as SanityEvent } from "@/lib/sanity/sanity.types";
import { MonoLabel } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { parseEventDateTime } from "@/lib/utils/event-datetime";

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
  /** ISO datetime of the event end; when on a later day, the meta shows a range. */
  dateEnd?: string | null;
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

// Mirrors the <EditorialHero> featured-image hover idiom (PRD §6e2): the whole
// ticket tilts + scales on hover/focus and reveals a "Meer details →" cue, with
// every transform reset under reduced-motion.
const CARD_CLASS =
  "border-ink bg-cream text-ink shadow-paper-sm relative flex border-2 transition-transform duration-300 " +
  "group-hover:scale-[1.02] group-hover:-rotate-1 group-focus-visible:scale-[1.02] group-focus-visible:-rotate-1 " +
  "motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0 " +
  "motion-reduce:group-focus-visible:scale-100 motion-reduce:group-focus-visible:rotate-0";

// The locale's trailing period on abbreviated months is dropped so styling
// owns the casing.
const stripMonthDot = (s: string) => s.replace(/\.$/, "");

/**
 * Mono meta line under the title:
 *  - multi-day → date range (`14–15 sep`, or `30 sep–2 okt` across months);
 *  - single-day with a time → the start time (`18:00`);
 *  - all-day single-day (`00:00`) → time omitted.
 * The location is appended with a `·` separator. Returns `null` when there is
 * nothing to show (all-day, no location).
 */
function buildMeta(
  start: DateTime,
  end: DateTime | null,
  location: string | null | undefined,
): string | null {
  const trimmedLocation = location?.trim();
  let lead: string | null = null;

  // Only a genuine multi-day span (end on a later day) shows a range; a missing,
  // same-day, or mistakenly-reversed end falls back to the single-day start time.
  const isMultiDay =
    start.isValid &&
    !!end?.isValid &&
    end.toMillis() > start.toMillis() &&
    !start.hasSame(end, "day");

  if (isMultiDay && end) {
    const sd = start.toFormat("d");
    const ed = end.toFormat("d");
    const em = stripMonthDot(end.toFormat("MMM"));
    const sameMonth = start.hasSame(end, "month") && start.hasSame(end, "year");
    lead = sameMonth
      ? `${sd}–${ed} ${em}`
      : `${sd} ${stripMonthDot(start.toFormat("MMM"))}–${ed} ${em}`;
  } else if (start.isValid) {
    const time = start.toFormat("HH:mm");
    if (time !== "00:00") lead = time;
  }

  const parts = [lead, trimmedLocation].filter((part): part is string =>
    Boolean(part),
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Events-list ticket (Phase 6.E). A whole-stub link to `/evenementen/[slug]`
 * with a type-coloured tear-off date block (colour + text pill, never
 * colour-only — WCAG 1.4.1), display-serif title, and a mono `time · location`
 * meta. Consumed by the month-grouped `/evenementen` list and the detail
 * page's "Andere events" grid.
 */
export function TicketStub({
  title,
  href,
  dateStart,
  dateEnd,
  eventType,
  location,
}: TicketStubProps) {
  const type = eventType ?? DEFAULT_EVENT_TYPE;
  const start = parseEventDateTime(dateStart);
  const end = dateEnd ? parseEventDateTime(dateEnd) : null;
  const meta = buildMeta(start, end, location);

  return (
    <Link
      href={href}
      className="group focus-visible:outline-jersey-deep block focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div data-testid="ticket-stub-card" className={CARD_CLASS}>
        <div
          data-testid="ticket-stub-date"
          data-event-type={type}
          className={cn(
            "border-ink flex shrink-0 flex-col items-center justify-center border-r-2 border-dashed px-4 py-3 text-center uppercase",
            DATE_BLOCK_CLASS[type],
          )}
        >
          <span className={MONO_LABEL_CLASS}>
            {start.isValid ? start.toFormat("ccc") : ""}
          </span>
          <span className="font-display text-3xl leading-none font-bold">
            {start.isValid ? start.toFormat("d") : ""}
          </span>
          <span className={MONO_LABEL_CLASS}>
            {start.isValid ? stripMonthDot(start.toFormat("MMM")) : ""}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start gap-1 px-4 py-3 pr-28">
          <MonoLabel variant="pill-ink" size="sm">
            {type}
          </MonoLabel>
          <span className="font-display text-xl leading-tight font-bold">
            {title}
          </span>
          {meta && (
            <span
              data-testid="ticket-stub-meta"
              className={cn(MONO_LABEL_CLASS, "text-ink-muted")}
            >
              {meta}
            </span>
          )}
        </div>

        <span
          aria-hidden="true"
          className={cn(
            MONO_LABEL_CLASS,
            "text-jersey-deep pointer-events-none absolute right-3 bottom-3 opacity-0 transition-opacity duration-300",
            "group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none",
          )}
        >
          Meer details →
        </span>
      </div>
    </Link>
  );
}
