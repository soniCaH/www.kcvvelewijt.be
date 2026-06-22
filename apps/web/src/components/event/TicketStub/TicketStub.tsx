import Link from "next/link";
import type { DateTime } from "luxon";
import { MonoLabel } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { parseEventDateTime } from "@/lib/utils/event-datetime";
import {
  EVENT_TYPE_FILL,
  DEFAULT_EVENT_TYPE,
  type EventType,
} from "../event-type-style";

// The category type lives in `event-type-style` now (shared with the filter
// chips), but it types the public `eventType` prop, so re-export it from
// `<TicketStub>`'s established entry point. `DEFAULT_EVENT_TYPE` is an internal
// fallback — consumers import it from `event-type-style` directly, not here.
export type { EventType };

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

const MONO_LABEL_CLASS =
  "font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)]";

// Canonical press-down (the paper-stamped interactive idiom): the resting
// ticket sits on its offset shadow and presses into the page on hover/focus,
// with the transform gated behind motion-safe and a "Meer details →" cue.
const CARD_CLASS =
  "border-ink bg-cream text-ink shadow-paper-sm relative flex border-2 transition-all duration-300 " +
  "hover:shadow-none motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1 " +
  "group-hover:shadow-none motion-safe:group-hover:translate-x-1 motion-safe:group-hover:translate-y-1 " +
  "motion-safe:group-focus-visible:translate-x-1 motion-safe:group-focus-visible:translate-y-1 group-focus-visible:shadow-none";

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
 * page's "Andere evenementen" grid.
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
            EVENT_TYPE_FILL[type],
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
