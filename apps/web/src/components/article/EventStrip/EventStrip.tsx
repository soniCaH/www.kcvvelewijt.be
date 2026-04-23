"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowRight } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_TICKET_LABEL,
  formatTimeRange,
  resolveEventDate,
  type EventFactValue,
} from "@/components/article/blocks/EventFact";

export interface EventStripProps {
  feature: EventFactValue;
  className?: string;
}

const NOTE_COMPONENTS: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="font-body text-kcvv-gray-dark text-lg leading-[1.6]">
        {children}
      </p>
    ),
  },
};

/**
 * Design §5.4 + §8.2 — horizontal event strip. Renders beneath the §7.6
 * metadata bar and describes the event at display scale:
 *
 *   27           Lentetornooi U13
 *   APRIL    │   zaterdag · 10:00 – 17:00
 *   2026     │   Sportpark Elewijt · Driesstraat 14
 *            │
 *            │   Open voor spelers geboren in 2013 en 2014.
 *            │
 *            │   Inschrijven →
 *
 * Two-column grid on md+: serif-style date block on the left + vertical
 * 1 px `kcvv-gray-light` rule, title + metadata + note + CTA on the
 * right. Full-bleed like `TransferStrip` so it has canvas room on wide
 * desktops; the hero stays within the 70 rem body column to keep the
 * reading rhythm intact.
 *
 * CTA behaviour: rendered only when `ticketUrl` is set. The ticket
 * label defaults to Dutch "Inschrijven" when the editor leaves it blank.
 */
export const EventStrip = ({ feature, className }: EventStripProps) => {
  const resolvedDate = resolveEventDate(feature.date);
  const timeRange = formatTimeRange(feature.startTime, feature.endTime);
  const ticketLabel = feature.ticketLabel?.trim() || DEFAULT_TICKET_LABEL;

  // The top line beneath the title pairs the weekday with the time
  // range when both are present; either alone is acceptable.
  const whenParts = [
    resolvedDate.hasDate ? resolvedDate.weekday : null,
    timeRange,
  ].filter((x): x is string => typeof x === "string" && x.length > 0);
  const whereParts = [feature.location, feature.address].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );

  return (
    <section
      data-testid="event-strip"
      className={cn(
        // Break out of the 70 rem body column so the date block + copy
        // column breathe on wide desktops.
        "full-bleed border-kcvv-gray-light border-y py-10 md:py-16",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-outer mx-auto grid px-6",
          "gap-8 md:gap-10",
          "md:grid-cols-[auto_minmax(0,1fr)]",
        )}
      >
        {/* Left — serif-style date block with a vertical rule on the right */}
        <div
          data-testid="event-strip-date"
          className={cn("md:border-kcvv-gray-light flex md:border-r md:pr-10")}
        >
          {resolvedDate.hasDate ? (
            <time
              dateTime={resolvedDate.dateIso}
              className="flex flex-col items-start"
            >
              <span className="font-title text-kcvv-gray-blue text-[5rem] leading-[0.85] font-bold md:text-[6rem]">
                {resolvedDate.day}
              </span>
              <span className="font-title text-kcvv-gray-blue mt-2 text-xl font-bold tracking-[var(--letter-spacing-label)] uppercase">
                {resolvedDate.monthLong}
              </span>
              <span className="text-kcvv-gray mt-1 font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase">
                {resolvedDate.year}
              </span>
            </time>
          ) : (
            <span
              data-testid="event-strip-date-tbd"
              className="text-kcvv-gray font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase"
            >
              Datum volgt
            </span>
          )}
        </div>

        {/* Right — title, metadata rows, note, CTA */}
        <div className="flex flex-col gap-4">
          {feature.title && (
            <h2
              data-testid="event-strip-title"
              className="font-title text-kcvv-gray-blue text-3xl leading-[1.05] font-bold md:text-4xl"
            >
              {feature.title}
            </h2>
          )}

          {whenParts.length > 0 && (
            <p
              data-testid="event-strip-when"
              className="text-kcvv-gray-dark font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase"
            >
              {whenParts.map((part, i) => (
                <span key={part}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-kcvv-gray-light mx-2"
                    >
                      ·
                    </span>
                  )}
                  {part}
                </span>
              ))}
            </p>
          )}

          {whereParts.length > 0 && (
            <p
              data-testid="event-strip-where"
              className="text-kcvv-gray-dark font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase"
            >
              {whereParts.map((part, i) => (
                <span key={part}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-kcvv-gray-light mx-2"
                    >
                      ·
                    </span>
                  )}
                  {part}
                </span>
              ))}
            </p>
          )}

          {Array.isArray(feature.note) && feature.note.length > 0 && (
            <div data-testid="event-strip-note" className="mt-2">
              <PortableText value={feature.note} components={NOTE_COMPONENTS} />
            </div>
          )}

          {feature.ticketUrl && (
            <a
              data-testid="event-strip-cta"
              href={feature.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-2 inline-flex items-center gap-2 self-start",
                "font-title text-base font-bold tracking-[var(--letter-spacing-caps)] uppercase",
                "text-kcvv-green-dark decoration-kcvv-green-bright underline decoration-1 underline-offset-4",
                "transition-[text-decoration-thickness] duration-150 hover:decoration-2",
              )}
            >
              {ticketLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
