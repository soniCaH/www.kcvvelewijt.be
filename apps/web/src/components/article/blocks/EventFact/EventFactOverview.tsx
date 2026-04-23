import { ExternalLink } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_TICKET_LABEL,
  formatTimeRange,
  resolveEventRange,
  type EventFactValue,
} from "./types";

export interface EventFactOverviewProps {
  value: EventFactValue;
  className?: string;
}

/**
 * Design §8.2 — overview variant of an `eventFact` body block. Rendered
 * for subsequent eventFact blocks in an event article (the first one is
 * absorbed by the `EventStrip` beneath the metadata bar), or inline
 * inside an announcement.
 *
 * Shares the dark-band treatment with `TransferFactOverview`:
 * consecutive rows fuse into one continuous dark section via the
 * `[data-testid='transfer-overview']` / `[data-testid='event-overview']`
 * sibling rules in `globals.css`.
 *
 * Four slots on md+:
 *   [date]   [title + metadata]   [CTA link]   [status?]
 *
 * The CTA renders only when `ticketUrl` is set — otherwise the column
 * collapses so the title + metadata claim the freed width.
 */
export const EventFactOverview = ({
  value,
  className,
}: EventFactOverviewProps) => {
  const range = resolveEventRange(value.date, value.endDate, value.sessions);
  const timeRange = formatTimeRange(value.startTime, value.endTime);

  // Prefer the age group when it has real content; fall back to the
  // competition tag otherwise. `??` alone would let an empty-string
  // `ageGroup` suppress the tag, which editors hit when they clear the
  // field without also clearing the value.
  const ageOrCompetition = value.ageGroup?.trim() || value.competitionTag;

  // For single-day events the time row belongs in the meta. Multi-day
  // continuous events + recurring events let the date column carry
  // the span — no count in the meta (it'd be redundant with the date
  // column's visible range, and `N sessies` reads poorly in Dutch).
  const timeMeta = range.kind === "single" ? timeRange : undefined;

  const metaParts = [timeMeta, value.location, ageOrCompetition].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );

  const ticketLabel = value.ticketLabel?.trim() || DEFAULT_TICKET_LABEL;

  return (
    <section
      data-testid="event-overview"
      className={cn(
        // Break out of the 65 ch prose column into the shared dark band.
        // Consecutive eventFact overviews fuse into one continuous
        // section via the sibling rules in globals.css (same pattern as
        // transferFact overview).
        "full-bleed not-prose bg-kcvv-gray-dark py-6",
        "border-kcvv-white/10 border-t",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-outer mx-auto grid px-6",
          "gap-x-6 gap-y-3",
          // Date column widened from `6rem` → `9rem` so cross-month
          // and multi-day ranges (e.g. `31 JUL – 2 AUG` + weekday
          // pair) fit on one line instead of wrapping to three.
          "md:grid-cols-[9rem_minmax(0,1fr)_auto] md:items-center md:gap-x-8",
        )}
      >
        {range.kind === "single" && (
          <time
            data-testid="event-overview-date"
            dateTime={range.date.dateIso}
            className="text-kcvv-white flex flex-col"
          >
            <span className="font-title text-xl leading-[0.95] font-bold">
              {range.date.day}{" "}
              <span className="uppercase">{range.date.monthShort}</span>
            </span>
            <span className="text-kcvv-gray-light mt-1 font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase">
              {range.date.weekday}
            </span>
          </time>
        )}
        {(range.kind === "range" || range.kind === "sessions") && (
          <div
            data-testid="event-overview-date"
            className="text-kcvv-white flex flex-col"
          >
            <span className="font-title text-xl leading-[0.95] font-bold">
              <time dateTime={range.start.dateIso}>
                {range.start.day}
                {!range.sameMonth && (
                  <span className="uppercase"> {range.start.monthShort}</span>
                )}
              </time>
              <span className="text-kcvv-white/40 mx-1">–</span>
              <time dateTime={range.end.dateIso}>
                {range.end.day}{" "}
                <span className="uppercase">
                  {range.sameMonth
                    ? range.start.monthShort
                    : range.end.monthShort}
                </span>
              </time>
            </span>
            <span className="text-kcvv-gray-light mt-1 font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase">
              {/* 3-letter weekday abbreviations so ranges stay on one
                  line in the narrow date column (e.g. "vr – zo" vs
                  "vrijdag – zondag"). */}
              {range.start.weekday.slice(0, 3)} –{" "}
              {range.end.weekday.slice(0, 3)}
            </span>
          </div>
        )}
        {range.kind === "none" && (
          <div
            data-testid="event-overview-date"
            className="text-kcvv-white flex flex-col"
          >
            <span className="text-kcvv-gray-light font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase">
              Datum volgt
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {value.title && (
            <span
              data-testid="event-overview-title"
              className="font-title text-kcvv-white text-lg font-bold"
            >
              {value.title}
            </span>
          )}
          {metaParts.length > 0 && (
            <span
              data-testid="event-overview-meta"
              className="text-kcvv-gray-light font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase"
            >
              {metaParts.map((part, i) => (
                <span key={part}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-kcvv-white/30 mx-2"
                    >
                      ·
                    </span>
                  )}
                  {part}
                </span>
              ))}
            </span>
          )}
        </div>

        {value.ticketUrl ? (
          <a
            data-testid="event-overview-cta"
            href={value.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "font-title inline-flex items-baseline gap-1 text-sm font-bold tracking-[var(--letter-spacing-caps)] uppercase",
              "text-kcvv-green-bright decoration-kcvv-green-bright underline decoration-1 underline-offset-4",
              "transition-[text-decoration-thickness] duration-150 hover:decoration-2",
            )}
          >
            {ticketLabel}
            <ExternalLink
              aria-hidden="true"
              className="ml-0.5 inline-block align-baseline opacity-60"
              size="0.75em"
            />
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        ) : (
          // Grid spacer — keeps the CTA column present so adjacent rows
          // with a CTA stay aligned when this row has none.
          <div aria-hidden="true" className="hidden md:block" />
        )}
      </div>
    </section>
  );
};
