"use client";

/**
 * <TrackInView> — fires a single `trackEvent(eventName, params)` call the
 * first time the wrapped subtree intersects the viewport at or above the
 * given `threshold`. After firing, the observer disconnects and the
 * component renders only its children — zero further DOM overhead.
 *
 * Server-rendered consumers (page templates) wrap conditionally — i.e.
 * only mount this wrapper when the event SHOULD fire — so the
 * intersection trigger is purely "is the section visible yet?", not
 * "should the section fire at all?". This keeps the dedup logic in the
 * data layer rather than the client.
 *
 * Behaviour notes:
 *  - Fires at most once per mount (re-mounts re-fire — analytics rule
 *    consistent with `useResponsibilityAnalytics`).
 *  - SSR-safe: the effect is a no-op until hydrated.
 *  - `params` is captured at mount time; subsequent prop mutations DO NOT
 *    re-fire. Keep `params` derivable from stable inputs (route slug,
 *    hashed IDs).
 */

import { useEffect, useRef, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

export interface TrackInViewProps {
  eventName: string;
  params?: Record<string, unknown>;
  /** 0 — 1, fraction of the wrapper's bounding box that must intersect. */
  threshold?: number;
  children: ReactNode;
}

export function TrackInView({
  eventName,
  params,
  threshold = 0.4,
  children,
}: TrackInViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);
  // `useRef(initial)` only reads `initial` on the first render — subsequent
  // renders ignore changes to `params`. That is the snapshot behaviour we
  // want: the event fires once and reflects the props at mount time.
  // Don't replace with `useEffect(() => { paramsRef.current = params })`.
  const paramsRef = useRef(params);

  // Clamp the threshold into IntersectionObserver's accepted [0, 1] range and
  // reject non-finite values (NaN / ±Infinity), which would throw RangeError.
  const safeThreshold = Number.isFinite(threshold)
    ? Math.min(1, Math.max(0, threshold))
    : 0.4;

  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    if (firedRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            trackEvent(eventName, paramsRef.current);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: safeThreshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eventName, safeThreshold]);

  return (
    <div ref={ref} data-track-event={eventName}>
      {children}
    </div>
  );
}
