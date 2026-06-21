"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

export type GalleryOpenSource = "list" | "match" | "event";

export interface GalleryOpenTrackerProps {
  /** Gallery slug — non-PII, sent as `gallery_slug`. */
  gallerySlug: string;
  /** Number of photos in the gallery, sent as `image_count`. */
  imageCount: number;
  /** Where the gallery was opened from. Default "list". */
  source?: GalleryOpenSource;
}

/**
 * Fires `gallery_open` once per mount on `/galerij/[slug]`. Rendered as a
 * sibling of the gallery content so the page stays server-renderable — mirrors
 * `<EventViewTracker>`. The ref guard makes it fire-once under StrictMode /
 * fast-refresh effect double-invocation.
 */
export const GalleryOpenTracker = ({
  gallerySlug,
  imageCount,
  source = "list",
}: GalleryOpenTrackerProps) => {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    trackEvent("gallery_open", {
      gallery_slug: gallerySlug,
      image_count: imageCount,
      source,
    });
    // Fire-once-per-mount — the ref guard is the dedup; empty deps are intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
