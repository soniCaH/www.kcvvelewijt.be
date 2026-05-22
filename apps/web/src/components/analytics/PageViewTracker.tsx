"use client";

/**
 * <PageViewTracker> — fires a single `trackEvent(eventName, params)` call
 * once per mount. Use for `*_view` page-level events that should fire as
 * soon as the page hydrates (independent of scroll position).
 *
 * Mount once at the top of a page template. The component renders nothing.
 * Subsequent re-renders DO NOT re-fire; the event ID is captured at mount.
 */

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

export interface PageViewTrackerProps {
  eventName: string;
  params?: Record<string, unknown>;
}

export function PageViewTracker({ eventName, params }: PageViewTrackerProps) {
  useEffect(() => {
    trackEvent(eventName, params);
    // Mount-once semantics: deliberately omit `params` from deps so a
    // changing param object doesn't re-fire. Pages remount on slug change,
    // which is the only legitimate re-fire trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);

  return null;
}
