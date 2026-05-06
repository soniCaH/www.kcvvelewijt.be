/**
 * <EventFactStrip> — Phase 3 §5.B.2 / `event-locked.md`.
 *
 * Layout C: ticket-stub banner. Three cells separated by dashed seams:
 *
 *   ┌──────────┬─────────────────────────────┬────────────┐
 *   │  date    │  Locatie · Aftrap            │ RESERVEER →│
 *   │  block   │  venue + time / sessions     │ (CTA cell) │
 *   │ jersey-  │  address · capacity · price  │            │
 *   │  deep    │  ★ Ook in agenda → (optional)│            │
 *   └──────────┴─────────────────────────────┴────────────┘
 *
 *  - `eventFact.sessions[]` non-empty → recurring schedule replaces the
 *    single-day venue + time line.
 *  - `eventFact.ticketUrl` empty → CTA cell hides; body cell stretches.
 *  - `linkedEventSlug` set → trailing "★ Ook in agenda →" line links to
 *    `/events/${slug}`.
 *
 * Layout: viewport-responsive (`md:` at 768px). Below that the banner
 * stacks vertically (date → seam → body → optional CTA). The
 * `orientation` prop forces vertical for Storybook fixtures.
 */
import Link from "next/link";
import { getButtonClasses } from "@/components/design-system/Button";
import {
  formatTimeRange,
  resolveEventDate,
  resolveEventRange,
  type EventFactValue,
  type ResolvedEventRange,
  type ResolvedSession,
} from "../EventFact/types";

export type EventFactStripOrientation = "auto" | "vertical";

interface EventFactStripProps {
  value: EventFactValue;
  /** When set, renders the "★ Ook in agenda →" line linking to /events/{slug}. */
  linkedEventSlug?: string;
  /**
   * `auto` (default): viewport-responsive. `vertical`: force vertical
   * layout regardless of viewport. Used by Storybook fixtures.
   */
  orientation?: EventFactStripOrientation;
}

// Each cell is a flex item directly under the banner container — no
// wrapper layer. The seam border between cells is applied explicitly
// to non-first cells (body + CTA) — the date cell carries no seam
// border. Horizontal vs vertical flips top→left at md+ (or stays top
// when forceVertical).
function trailingSeamClasses(forceVertical: boolean) {
  return forceVertical
    ? "border-paper-edge border-t border-dashed"
    : "border-paper-edge border-t border-dashed md:border-t-0 md:border-l";
}

function DateBlock({
  range,
  className,
}: {
  range: ResolvedEventRange;
  className: string;
}) {
  const cellClass = `bg-jersey-deep text-cream flex shrink-0 flex-col items-center justify-center px-6 py-8 text-center md:basis-[160px] ${className}`;

  if (range.kind === "none") {
    return (
      <div className={cellClass}>
        <span className="font-serif text-3xl leading-none font-black italic">
          —
        </span>
        <span className="mt-2 font-mono text-xs leading-none uppercase opacity-80">
          Datum volgt
        </span>
      </div>
    );
  }

  if (range.kind === "single") {
    return (
      <div className={cellClass}>
        <span className="font-serif text-6xl leading-none font-black italic">
          {range.date.day}
        </span>
        <span className="mt-2 font-mono text-xs leading-none uppercase opacity-80">
          {range.date.monthShort} &apos;{range.date.year.slice(-2)}
        </span>
      </div>
    );
  }

  // range / sessions
  const start = range.start;
  const end = range.end;
  const monthLabel = range.sameMonth
    ? `${start.monthShort} '${start.year.slice(-2)}`
    : `${start.monthShort} – ${end.monthShort} '${end.year.slice(-2)}`;
  return (
    <div className={cellClass}>
      <span className="font-serif text-5xl leading-none font-black italic">
        {start.day}–{end.day}
      </span>
      <span className="mt-2 font-mono text-xs leading-none uppercase opacity-80">
        {monthLabel}
      </span>
    </div>
  );
}

function SessionsList({ sessions }: { sessions: ResolvedSession[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {sessions.map((s, i) => {
        const time = formatTimeRange(s.startTime, s.endTime);
        return (
          <li
            key={s._key ?? i}
            className="text-ink-muted font-mono text-xs leading-tight uppercase"
          >
            <span className="text-ink font-bold">
              {s.date.weekday} {s.date.day}/{s.date.monthShort}
            </span>
            {time !== undefined ? <span> · {time}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

function BodyCell({
  value,
  range,
  linkedEventSlug,
  className,
}: {
  value: EventFactValue;
  range: ResolvedEventRange;
  linkedEventSlug?: string;
  className: string;
}) {
  const isRecurring = range.kind === "sessions";
  const label = isRecurring
    ? "Locatie · Uurschema per dag"
    : "Locatie · Aftrap";

  const startTime =
    !isRecurring && range.kind === "single" ? value.startTime : undefined;
  const headLine = [value.location, startTime].filter(Boolean).join(" · ");
  const subLine = [
    value.address,
    value.capacity !== undefined ? `max ${value.capacity}` : null,
  ]
    .filter((v): v is string => Boolean(v))
    .join(" · ");

  return (
    <div className={`bg-cream flex flex-1 flex-col px-6 py-6 ${className}`}>
      <span className="text-jersey-deep font-mono text-xs leading-none font-bold uppercase">
        {label}
      </span>
      {headLine !== "" ? (
        <p className="mt-1 font-serif text-2xl leading-tight font-black italic">
          {headLine}
        </p>
      ) : null}
      {subLine !== "" ? (
        <p className="text-ink-muted mt-1 font-mono text-xs uppercase">
          {subLine}
        </p>
      ) : null}
      {isRecurring && range.kind === "sessions" ? (
        <SessionsList sessions={range.sessions} />
      ) : null}
      {linkedEventSlug !== undefined ? (
        <Link
          href={`/events/${linkedEventSlug}`}
          className="text-jersey-deep mt-3 inline-block font-mono text-xs leading-none font-bold uppercase hover:underline"
        >
          ★ Ook in agenda →
        </Link>
      ) : null}
    </div>
  );
}

function CtaCell({
  ticketUrl,
  ticketLabel,
  className,
}: {
  ticketUrl: string;
  ticketLabel: string;
  className: string;
}) {
  return (
    <div
      className={`bg-cream flex shrink-0 items-center justify-center px-6 py-6 md:px-8 ${className}`}
    >
      <Link
        href={ticketUrl}
        className={getButtonClasses({ variant: "primary", size: "sm" })}
      >
        {ticketLabel}
        <span aria-hidden="true" className="ml-1">
          →
        </span>
      </Link>
    </div>
  );
}

export function EventFactStrip({
  value,
  linkedEventSlug,
  orientation = "auto",
}: EventFactStripProps) {
  const range = resolveEventRange(value.date, value.endDate, value.sessions);
  const ticketUrl = value.ticketUrl?.trim();
  const ticketLabel = value.ticketLabel ?? "Inschrijven";
  const showCta = ticketUrl !== undefined && ticketUrl !== "";
  const forceVertical = orientation === "vertical";

  // Outer chrome — solid ink border + paper-md offset shadow, matches
  // TapedCard silhouette without the rotation (banner sits flat on the
  // page). max-w-[920px] keeps the ticket from sprawling on wide screens.
  const containerClasses = forceVertical
    ? "border-2 border-ink shadow-paper-md mx-auto my-10 flex max-w-[920px] flex-col bg-cream"
    : "border-2 border-ink shadow-paper-md mx-auto my-10 flex max-w-[920px] flex-col md:flex-row bg-cream";

  const seam = trailingSeamClasses(forceVertical);

  return (
    <div className={containerClasses}>
      <DateBlock range={range} className="" />
      <BodyCell
        value={value}
        range={range}
        linkedEventSlug={linkedEventSlug}
        className={seam}
      />
      {showCta ? (
        <CtaCell
          ticketUrl={ticketUrl}
          ticketLabel={ticketLabel}
          className={seam}
        />
      ) : null}
    </div>
  );
}

// `resolveEventDate` is imported alongside `resolveEventRange` to keep
// the module's surface area visible — callers building bespoke event UIs
// outside the strip can reuse the single-date resolver via the EventFact
// barrel.
void resolveEventDate;
