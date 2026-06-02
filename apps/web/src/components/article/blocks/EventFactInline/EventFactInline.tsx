import Link from "next/link";
import { TapedCard } from "@/components/design-system/TapedCard";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { getButtonClasses } from "@/components/design-system/Button";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_TICKET_LABEL,
  formatTimeRange,
  resolveEventRange,
  type EventFactValue,
  type ResolvedEventRange,
} from "../EventFact/types";

export interface EventFactInlineProps {
  value: EventFactValue;
  /**
   * Past/upcoming flag derived page-level via `deriveIsPast` (shared with
   * `<EventDetailBlock>`). Past events keep the card visible as a
   * historical record but swap the tag pill for `Afgelopen` and hide the
   * CTA.
   */
  isPast: boolean;
  /**
   * Optional slug pointing at a linked event document. When supplied,
   * renders an "★ Ook in agenda →" line at the bottom of the card.
   */
  linkedEventSlug?: string;
  className?: string;
}

const PAST_LABEL = "Afgelopen";

function safeExternalHref(raw: string | undefined | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? trimmed
      : null;
  } catch {
    return null;
  }
}

function capitalize(input: string): string {
  return input ? input.charAt(0).toUpperCase() + input.slice(1) : input;
}

function formatDateLine(range: ResolvedEventRange): string | null {
  switch (range.kind) {
    case "none":
      return null;
    case "single": {
      const d = range.date;
      return `${capitalize(d.weekday)} ${d.day} ${d.monthLong}`;
    }
    case "range": {
      const start = range.start;
      const end = range.end;
      if (range.sameMonth) {
        return `${start.day}–${end.day} ${end.monthLong}`;
      }
      if (range.sameYear) {
        return `${start.day} ${start.monthShort} – ${end.day} ${end.monthLong}`;
      }
      return `${start.day} ${start.monthShort} ${start.year} – ${end.day} ${end.monthShort} ${end.year}`;
    }
    case "sessions": {
      const start = range.start;
      const end = range.end;
      if (range.sameMonth) {
        return `${start.day}–${end.day} ${end.monthLong}`;
      }
      if (range.sameYear) {
        return `${start.day} ${start.monthShort} – ${end.day} ${end.monthLong}`;
      }
      return `${start.day} ${start.monthShort} ${start.year} – ${end.day} ${end.monthShort} ${end.year}`;
    }
  }
}

function buildDateAndTimeLine(
  range: ResolvedEventRange,
  value: EventFactValue,
): string | null {
  const datePart = formatDateLine(range);
  if (!datePart) return null;
  // Append a top-level time range only when sessions/range haven't
  // already taken over the line. Sessions-based events carry per-session
  // hours that live on `<EventDetailBlock>` — the inline card stays
  // intentionally light.
  if (range.kind === "single") {
    const time = formatTimeRange(value.startTime, value.endTime);
    if (time) return `${datePart} · ${time}`;
  }
  return datePart;
}

function buildMetaParts(value: EventFactValue): string[] {
  const parts: string[] = [];
  if (value.location?.trim()) parts.push(value.location.trim());
  if (typeof value.capacity === "number" && value.capacity > 0) {
    parts.push(`Max ${value.capacity} plaatsen`);
  }
  return parts;
}

/**
 * <EventFactInline> — Phase 5 inline polaroid renderer for body-block
 * eventFact references (eventfact-inline-locked.md, drill 5.d-evt-inline).
 *
 * Composition: `<TapedCard>` cream-white frame + two ochre tape strips
 * at top-left @ -5° (`rotation="polaroid-a"`) and bottom-right @ +4°
 * (`verticalEdge="bottom"` + `rotation="polaroid-b"`) per
 * eventfact-inline-locked.md §Round 1. The `<TapeStrip>` primitive was
 * extended in #1853 to support bottom-edge anchor + polaroid-scale
 * rotations specifically for this composition.
 *
 * Past-event treatment mirrors `<EventDetailBlock>`: muted `Afgelopen`
 * pill in place of the competitionTag, CTA suppressed entirely.
 *
 * `sessions[]` + `note` PortableText are NOT rendered inline — they stay
 * exclusive to `<EventDetailBlock>` per the compression rules in the
 * lock doc.
 */
export function EventFactInline({
  value,
  isPast,
  linkedEventSlug,
  className,
}: EventFactInlineProps) {
  const range = resolveEventRange(value.date, value.endDate, value.sessions);
  const title = value.title?.trim();
  const tag = value.competitionTag?.trim();
  const dateLine = buildDateAndTimeLine(range, value);
  const metaParts = buildMetaParts(value);
  const ticketUrl = !isPast ? safeExternalHref(value.ticketUrl) : null;
  const ticketLabel = value.ticketLabel?.trim() || DEFAULT_TICKET_LABEL;
  const linkedSlug = linkedEventSlug?.trim();

  return (
    <div
      data-event-fact-inline="true"
      data-is-past={isPast ? "true" : "false"}
      className={cn("eventfact-polaroid mx-auto my-10 w-full", className)}
      style={{ maxWidth: "var(--container-prose)" }}
    >
      <TapedCard
        bg="cream"
        // Two ochre tape strips per eventfact-inline-locked §Round 1:
        // top-left @ -5° (polaroid-a) + bottom-right @ +4° (polaroid-b).
        // Both pool tokens scoped to this composition only — see
        // `TapeStripRotation` JSDoc for the discipline rationale.
        tape={[
          {
            color: "warm",
            length: "sm",
            position: "left",
            rotation: "polaroid-a",
          },
          {
            color: "warm",
            length: "sm",
            position: "right",
            verticalEdge: "bottom",
            rotation: "polaroid-b",
          },
        ]}
        padding="lg"
      >
        <section
          data-event-fact-inline-content="true"
          className="flex flex-col gap-3"
        >
          <header className="flex items-center gap-3">
            {isPast ? (
              <MonoLabel variant="pill-cream">{PAST_LABEL}</MonoLabel>
            ) : tag ? (
              <MonoLabel variant="pill-jersey">{tag}</MonoLabel>
            ) : null}
            {value.ageGroup?.trim() ? (
              <span
                data-event-fact-inline="age"
                className="text-ink-muted font-mono text-[10px] tracking-[0.16em] uppercase"
              >
                {value.ageGroup.trim()}
              </span>
            ) : null}
          </header>

          {title ? (
            <h3
              data-event-fact-inline="title"
              className="font-display text-ink m-0 text-[26px] leading-[1.15] font-bold italic"
            >
              {title}
            </h3>
          ) : null}

          {dateLine ? (
            <p
              data-event-fact-inline="date"
              className="font-display text-ink m-0 text-[18px] leading-[1.3] font-semibold italic"
            >
              {dateLine}
            </p>
          ) : null}

          {metaParts.length > 0 ? (
            <p
              data-event-fact-inline="meta"
              className="text-ink-muted m-0 font-mono text-[10px] tracking-[0.16em] uppercase"
            >
              {metaParts.map((part, i) => (
                <span key={part}>
                  {i > 0 ? <span aria-hidden="true"> · </span> : null}
                  {part}
                </span>
              ))}
            </p>
          ) : null}

          {ticketUrl ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-event-fact-inline="cta"
              className={cn(
                getButtonClasses({ variant: "primary", size: "sm" }),
                "w-fit uppercase",
              )}
            >
              {ticketLabel}
              <span aria-hidden="true" className="ml-1">
                →
              </span>
            </a>
          ) : null}

          {linkedSlug ? (
            <Link
              href={`/evenementen/${linkedSlug}`}
              data-event-fact-inline="linked-event"
              className="text-ink-muted hover:text-ink font-mono text-[10px] tracking-[0.16em] uppercase underline-offset-4 hover:underline"
            >
              <span aria-hidden="true">★ </span>Ook in agenda{" "}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </section>
      </TapedCard>
    </div>
  );
}
