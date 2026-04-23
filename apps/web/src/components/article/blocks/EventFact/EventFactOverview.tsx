import { ArrowRight } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_TICKET_LABEL,
  formatTimeRange,
  resolveEventDate,
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
  const resolvedDate = resolveEventDate(value.date);
  const timeRange = formatTimeRange(value.startTime, value.endTime);

  const metaParts = [
    timeRange,
    value.location,
    value.ageGroup ?? value.competitionTag,
  ].filter((x): x is string => typeof x === "string" && x.length > 0);

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
          "md:grid-cols-[6rem_minmax(0,1fr)_auto] md:items-center md:gap-x-8",
        )}
      >
        {resolvedDate.hasDate ? (
          <time
            data-testid="event-overview-date"
            dateTime={resolvedDate.dateIso}
            className="text-kcvv-white flex flex-col"
          >
            <span className="font-title text-xl leading-[0.95] font-bold">
              {resolvedDate.day}{" "}
              <span className="uppercase">{resolvedDate.monthShort}</span>
            </span>
            <span className="text-kcvv-gray-light mt-1 font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase">
              {resolvedDate.weekday}
            </span>
          </time>
        ) : (
          <div
            data-testid="event-overview-date"
            className="text-kcvv-white flex flex-col"
          >
            <span className="text-kcvv-gray-light font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase">
              tbd
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
              "font-title inline-flex items-center gap-2 text-sm font-bold tracking-[var(--letter-spacing-caps)] uppercase",
              "text-kcvv-green-bright decoration-kcvv-green-bright underline decoration-1 underline-offset-4",
              "transition-[text-decoration-thickness] duration-150 hover:decoration-2",
            )}
          >
            {ticketLabel}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
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
