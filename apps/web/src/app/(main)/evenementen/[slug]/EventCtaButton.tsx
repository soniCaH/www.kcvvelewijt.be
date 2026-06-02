"use client";

import { ExternalLink } from "@/lib/icons";
import { trackEvent } from "@/lib/analytics/track-event";

export interface EventCtaButtonProps {
  href: string;
  label: string;
  /** Slug of the event being viewed — non-PII, sent as `event_slug`. */
  eventSlug: string;
}

export function EventCtaButton({
  href,
  label,
  eventSlug,
}: EventCtaButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackEvent("event_external_link_click", {
          event_slug: eventSlug,
          label,
        })
      }
      className="bg-kcvv-green-bright hover:bg-kcvv-green inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium text-white transition-colors"
    >
      {label}
      <ExternalLink className="ml-2 h-5 w-5" aria-hidden="true" />
    </a>
  );
}
