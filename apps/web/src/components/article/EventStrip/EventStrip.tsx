"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowRight, ExternalLink } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";
import { useArticleAnalytics } from "@/hooks/useArticleAnalytics";
import {
  DEFAULT_TICKET_LABEL,
  resolveEventRange,
  type EventFactValue,
} from "@/components/article/blocks/EventFact";

export interface EventStripProps {
  feature: EventFactValue;
  /**
   * Sanity document id of the surrounding article. Required for
   * `event_cta_click` analytics; when absent the CTA still renders and
   * opens the ticket URL, it just doesn't emit an event (used by stories).
   */
  articleId?: string;
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
 *   25         │   Lentetornooi U13
 *   APRIL      │
 *   2026       │   10:00  →  17:00            ← display scale
 *   zaterdag   │
 *              │   Sportpark Elewijt · Driesstraat 14, Elewijt
 *              │   Open voor spelers geboren in 2013 en 2014.
 *              │   Inschrijven →
 *
 * Two-column grid on md+: serif-style date block on the left (day,
 * long month, year, weekday) + vertical 1 px `kcvv-gray-light` rule,
 * right column stacks title → display-scale time range → location meta
 * → note → CTA. The time range mirrors `TransferStrip`'s club → club
 * composition: the two most important facts render at display scale
 * with a direction arrow between.
 *
 * Time row rules:
 *   - both start + end → `10:00 → 17:00` with a Lucide arrow in green
 *   - only start      → `10:00` alone
 *   - neither         → row omitted (date block carries the schedule)
 *
 * CTA: rendered only when `ticketUrl` is set. Ticket label defaults to
 * Dutch "Inschrijven" when the editor leaves it blank.
 */
export const EventStrip = ({
  feature,
  articleId,
  className,
}: EventStripProps) => {
  const { trackEventCtaClick } = useArticleAnalytics();
  const range = resolveEventRange(
    feature.date,
    feature.endDate,
    feature.sessions,
  );
  const ticketLabel = feature.ticketLabel?.trim() || DEFAULT_TICKET_LABEL;

  const handleCtaClick = () => {
    if (!articleId) return;
    trackEventCtaClick({
      articleId,
      eventDate: feature.date ?? "",
      hasTicketUrl: Boolean(feature.ticketUrl),
    });
  };

  const startTime = feature.startTime?.trim() || undefined;
  const endTime = feature.endTime?.trim() || undefined;

  // Show the top-level time row ONLY for non-recurring events. When
  // `sessions` is populated, each session renders its own time range
  // inside the session list, so a single display-scale top-level time
  // would be meaningless.
  const hasTimeRow = range.kind !== "sessions" && Boolean(startTime || endTime);

  const whereParts = [feature.location, feature.address]
    .map((x) => (typeof x === "string" ? x.trim() : x))
    .filter((x): x is string => typeof x === "string" && x.length > 0);

  return (
    <section
      data-testid="event-strip"
      className={cn(
        // Align with the 70 rem hero + metadata bar so the event page
        // reads as a single indented column rather than three different
        // widths. The dark `EventFactOverview` stack below the strip
        // still breaks out wider (`max-w-outer`) — that's the deliberate
        // canvas moment. Full-bleed rules preserve the edge-to-edge
        // top/bottom borders across the viewport.
        "full-bleed border-kcvv-gray-light border-y py-10 md:py-16",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-inner-lg mx-auto grid px-6",
          "gap-8 md:gap-10",
          "md:grid-cols-[auto_minmax(0,1fr)]",
        )}
      >
        {/* Left — serif-style date block with a vertical rule on the right */}
        <div
          data-testid="event-strip-date"
          className={cn("md:border-kcvv-gray-light flex md:border-r md:pr-10")}
        >
          {range.kind === "single" && (
            <time
              dateTime={range.date.dateIso}
              className="flex flex-col items-start"
            >
              <span className="font-title text-kcvv-gray-blue text-[5rem] leading-[0.85] font-bold md:text-[6rem]">
                {range.date.day}
              </span>
              <span className="font-title text-kcvv-gray-blue mt-2 text-xl font-bold tracking-[var(--letter-spacing-label)] uppercase">
                {range.date.monthLong}
              </span>
              <span className="text-kcvv-gray mt-1 font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase">
                {range.date.year}
              </span>
              <span
                data-testid="event-strip-date-weekday"
                className="text-kcvv-gray mt-2 font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase"
              >
                {range.date.weekday}
              </span>
            </time>
          )}
          {(range.kind === "range" || range.kind === "sessions") && (
            <div
              data-testid={
                range.kind === "sessions"
                  ? "event-strip-date-sessions"
                  : "event-strip-date-range"
              }
              className="flex flex-col items-start"
            >
              {range.sameMonth ? (
                <>
                  {/* Same-month: huge `25 – 26` composition keeps the display
                      scale while signalling the two-day span. */}
                  <span className="font-title text-kcvv-gray-blue text-[5rem] leading-[0.85] font-bold md:text-[6rem]">
                    <time dateTime={range.start.dateIso}>
                      {range.start.day}
                    </time>
                    <span className="text-kcvv-gray-light mx-2">–</span>
                    <time dateTime={range.end.dateIso}>{range.end.day}</time>
                  </span>
                  <span className="font-title text-kcvv-gray-blue mt-2 text-xl font-bold tracking-[var(--letter-spacing-label)] uppercase">
                    {range.start.monthLong}
                  </span>
                  <span className="text-kcvv-gray mt-1 font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase">
                    {range.start.year}
                  </span>
                  <span
                    data-testid="event-strip-date-weekday"
                    className="text-kcvv-gray mt-2 font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase"
                  >
                    {range.start.weekday} – {range.end.weekday}
                  </span>
                </>
              ) : (
                <>
                  {/* Cross-month (or cross-year): compact "day month →
                      day month" composition at the title scale. Display-size
                      day numerals would overflow the 2-column strip on
                      cross-month labels. */}
                  <span className="font-title text-kcvv-gray-blue text-3xl leading-[1.05] font-bold md:text-4xl">
                    <time dateTime={range.start.dateIso}>
                      {range.start.day} {range.start.monthShort.toUpperCase()}
                    </time>
                    <span className="text-kcvv-gray-light mx-2">–</span>
                    <time dateTime={range.end.dateIso}>
                      {range.end.day} {range.end.monthShort.toUpperCase()}
                    </time>
                  </span>
                  <span className="text-kcvv-gray mt-2 font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase">
                    {range.sameYear
                      ? range.start.year
                      : `${range.start.year} – ${range.end.year}`}
                  </span>
                  <span
                    data-testid="event-strip-date-weekday"
                    className="text-kcvv-gray mt-2 font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase"
                  >
                    {range.start.weekday} – {range.end.weekday}
                  </span>
                </>
              )}
            </div>
          )}
          {range.kind === "none" && (
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

          {hasTimeRow && (
            <div
              data-testid="event-strip-time"
              className="flex items-center gap-3 md:gap-5"
            >
              {startTime && (
                <span className="font-title text-kcvv-gray-blue text-3xl leading-none font-bold md:text-4xl">
                  {startTime}
                </span>
              )}
              {startTime && endTime && (
                <ArrowRight
                  aria-hidden="true"
                  className="text-kcvv-green-bright h-6 w-6 shrink-0 md:h-8 md:w-8"
                />
              )}
              {endTime && (
                <span className="font-title text-kcvv-gray-blue text-3xl leading-none font-bold md:text-4xl">
                  {endTime}
                </span>
              )}
            </div>
          )}

          {range.kind === "sessions" && (
            <ul
              data-testid="event-strip-sessions"
              // Grid lays the weekday / date / start-time / arrow /
              // end-time into five fixed columns so the values line up
              // row-to-row. `tabular-nums` on the time columns locks
              // digit widths — without it, proportional digits shift
              // the arrow column horizontally (`11:30` narrower than
              // `18:00`).
              className={cn(
                "border-kcvv-gray-light grid gap-x-4 gap-y-2 border-t pt-4",
                "grid-cols-[auto_auto_auto_auto_auto] items-baseline justify-start",
              )}
            >
              {range.sessions.map((session, index) => (
                <li
                  // `_key` is the stable identifier for Sanity array
                  // items. Fall back to `<date>-<index>` rather than the
                  // date alone so two sessions on the same calendar day
                  // (e.g. morning + evening session) don't collide on
                  // key and trigger unstable reconciliation.
                  key={session._key ?? `${session.date.dateIso}-${index}`}
                  data-testid="event-strip-session-row"
                  className="contents"
                >
                  <span className="text-kcvv-gray-dark font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase">
                    {session.date.weekday.slice(0, 2)}
                  </span>
                  <time
                    dateTime={session.date.dateIso}
                    className="text-kcvv-gray-dark font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase"
                  >
                    {session.date.day} {session.date.monthShort}
                  </time>
                  <span className="font-title text-kcvv-gray-blue text-lg leading-none font-bold tabular-nums md:text-xl">
                    {session.startTime ?? (
                      <span className="text-kcvv-gray-light">–</span>
                    )}
                  </span>
                  <span className="flex items-center justify-center">
                    {session.startTime && session.endTime && (
                      <ArrowRight
                        aria-hidden="true"
                        className="text-kcvv-green-bright h-4 w-4 shrink-0"
                      />
                    )}
                  </span>
                  <span className="font-title text-kcvv-gray-blue text-lg leading-none font-bold tabular-nums md:text-xl">
                    {session.endTime ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {whereParts.length > 0 && (
            <p
              data-testid="event-strip-where"
              className="text-kcvv-gray-dark font-mono text-sm tracking-[var(--letter-spacing-caps)] uppercase"
            >
              {whereParts.map((part, i) => (
                // Composite key — belt and braces for the unlikely case
                // where location and address collide on the same string.
                <span key={`${i}-${part}`}>
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
              onClick={handleCtaClick}
              className={cn(
                "mt-2 inline-flex items-baseline gap-1 self-start",
                "font-title text-base font-bold tracking-[var(--letter-spacing-caps)] uppercase",
                "text-kcvv-green-dark decoration-kcvv-green-bright underline decoration-1 underline-offset-4",
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
          )}
        </div>
      </div>
    </section>
  );
};
