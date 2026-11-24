"use client";

/**
 * <TrackInView> — fires a single `trackEvent(eventName, params)` call the
 * first time the wrapped subtree is in view at or above the given
 * `threshold`: the threshold of the block's height, or the threshold of the
 * viewport height, whichever comes first. The viewport side is what lets a
 * block taller than viewport ÷ threshold fire, since it can never reach its
 * own threshold ratio. After firing, the observer disconnects and the
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
  /** 0 — 1, threshold of the block's height or threshold of the viewport height, whichever comes first. */
  threshold?: number;
  children: ReactNode;
}

/**
 * Steps of 0.01 up to `threshold`, plus `threshold` itself. The observer only
 * calls back when the ratio crosses one of these values, and a tall block
 * never reaches `threshold`, so it needs the lower steps to keep getting
 * callbacks while it scrolls.
 */
// shortcut: steps of 0.01, so a block taller than 100 viewports never fires and a tall block fires up to 1 % of its height late; switch to an exact per-element ratio if such a block appears.
const thresholdSteps = (threshold: number): number[] =>
  Array.from({ length: Math.ceil(threshold * 100) }, (_, i) => i / 100)
    .filter((step) => step < threshold)
    .concat(threshold);

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
          // `isIntersecting` is true at any ratio above 0: gate on the amount.
          const viewportHeight = entry.rootBounds?.height ?? window.innerHeight;
          if (
            entry.isIntersecting &&
            (entry.intersectionRatio >= safeThreshold ||
              entry.intersectionRect.height >=
                safeThreshold * viewportHeight) &&
            !firedRef.current
          ) {
            firedRef.current = true;
            trackEvent(eventName, paramsRef.current);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: thresholdSteps(safeThreshold) },
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
