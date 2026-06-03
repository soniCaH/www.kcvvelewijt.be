"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { DEFAULT_EVENT_TYPE, type EventType } from "../event-type-style";

export interface EventViewTrackerProps {
  /** Event slug — non-PII, sent as `event_slug`. */
  eventSlug: string;
  /** Event category — sent as `event_type` (fixed enum, no PII); "Andere" fallback. */
  eventType?: EventType | null;
}

/**
 * Fires `event_view` once per mount on `/evenementen/[slug]` (analytics PRD
 * §Events detail). Rendered as a sibling of `<EventHero>` so the hero stays
 * server-renderable / Storybook-mockable without analytics side effects —
 * mirrors `<ArticleViewTracker>`.
 *
 * The ref guard makes it fire-once even under React.StrictMode / fast-refresh
 * effect double-invocation.
 */
export const EventViewTracker = ({
  eventSlug,
  eventType,
}: EventViewTrackerProps) => {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    trackEvent("event_view", {
      event_slug: eventSlug,
      event_type: eventType ?? DEFAULT_EVENT_TYPE,
    });
    // Fire-once-per-mount — the ref guard is the dedup; empty deps are intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
