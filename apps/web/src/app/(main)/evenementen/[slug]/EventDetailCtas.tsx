"use client";

import { cn } from "@/lib/utils/cn";
import { trackEvent } from "@/lib/analytics/track-event";
import { buildEventIcs } from "@/lib/utils/event-ics";

export interface EventDetailCtasProps {
  /** Slug of the event — non-PII, sent as `event_slug`; also the `.ics` filename + UID. */
  eventSlug: string;
  eventTitle: string;
  /** ISO datetime of the event start. */
  dateStart: string;
  /** ISO datetime of the event end (optional). */
  dateEnd?: string | null;
  location?: string | null;
  /** VEVENT DESCRIPTION (e.g. a link back to the detail page). */
  description?: string | null;
  /** Absolute canonical URL of the detail page — embedded in the `.ics`. */
  canonicalUrl: string;
  /** External reservation/ticket URL — the Reserveer CTA only renders when set. */
  externalUrl?: string | null;
  /** External CTA label; falls back to "Reserveer". */
  externalLabel?: string | null;
}

// Editorial CTA pair (design lock 6e5 §3.5). Deliberately NOT the `<Button>`
// primitive: the lock calls for a **warm-filled** CTA in **mono-uppercase**
// "ticket" voice, neither of which the `<Button>` variants (jersey-deep / cream,
// sentence-case `font-medium`) express. Mirrors the paper-stamped idiom of
// `<DownloadButton>` — `border-2 border-ink` + `shadow-paper-sm` + the canonical
// press-down hover (feedback_canonical_press_down_hover).
const CTA_BASE = cn(
  "inline-flex items-center gap-2 border-2 border-ink px-[18px] py-3",
  "font-mono text-[12px] font-bold tracking-[0.06em] uppercase no-underline",
  "shadow-paper-sm transition-all duration-300",
  "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
  "motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0",
  "cursor-pointer focus-visible:ring-jersey-deep focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
);

/**
 * The two centred CTAs under the `<EventHero>` title:
 *  - **Reserveer ↗** (warm fill) — renders only when `externalUrl` is set;
 *    opens the external reservation/ticket link in a new tab.
 *  - **＋ Zet in agenda** (cream outline) — always present; builds a client-side
 *    `.ics` blob and triggers a download (no BFF — lock §3.5 / PRD §7).
 *
 * Both fire `event_detail_cta_click` with `{ event_slug, cta }`. The name is
 * deliberately distinct from the article surface's `event_cta_click` so the two
 * param shapes don't collide in GA4 (owner decision, #1967).
 */
export function EventDetailCtas({
  eventSlug,
  eventTitle,
  dateStart,
  dateEnd,
  location,
  description,
  canonicalUrl,
  externalUrl,
  externalLabel,
}: EventDetailCtasProps) {
  const reserveLabel = externalLabel?.trim() || "Reserveer";

  const handleReserveerClick = () => {
    trackEvent("event_detail_cta_click", {
      event_slug: eventSlug,
      cta: "reserveer",
    });
  };

  const handleAgendaClick = () => {
    const ics = buildEventIcs({
      uid: `${eventSlug}@kcvvelewijt.be`,
      title: eventTitle,
      dateStart,
      dateEnd,
      location,
      description,
      url: canonicalUrl,
      now: new Date().toISOString(),
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${eventSlug}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    trackEvent("event_detail_cta_click", {
      event_slug: eventSlug,
      cta: "agenda",
    });
  };

  return (
    <>
      {externalUrl && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleReserveerClick}
          className={cn(CTA_BASE, "bg-warm text-ink")}
        >
          {reserveLabel}
          <span aria-hidden="true">↗</span>
        </a>
      )}

      <button
        type="button"
        onClick={handleAgendaClick}
        className={cn(CTA_BASE, "bg-cream text-ink")}
      >
        <span aria-hidden="true">＋</span>
        Zet in agenda
      </button>
    </>
  );
}
