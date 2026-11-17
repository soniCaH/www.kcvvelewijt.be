"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import {
  useSponsorAnalytics,
  type SponsorSource,
} from "@/hooks/useSponsorAnalytics";
import { readSponsorAttrs } from "@/lib/analytics/sponsor-attrs";

export interface SponsorWallTrackerProps {
  /** The surface the wall sits on, sent on every event it fires. */
  source?: SponsorSource;
  children: ReactNode;
}

/** A tile counts as seen after this long at `IMPRESSION_THRESHOLD` visible. */
const DWELL_MS = 1000;
const IMPRESSION_THRESHOLD = 0.5;

/**
 * The one tracker for a sponsor wall (#3649, #3650). Reads the inert
 * `data-sponsor-id` / `data-sponsor-tier` markers every tile root emits, linked
 * or not.
 *
 * - Click: a marked link → `sponsor_click`; the same plus
 *   `data-sponsor-featured` on the marquee link → `sponsor_featured_click`. A
 *   marked tile that is not a link sends nothing.
 * - Impression: one shared observer; a tile at least half visible for 1 s in a
 *   visible tab → `sponsor_impression`, once per Sponsor per mount. The dwell
 *   pauses while the tab is hidden and restarts when it shows again.
 *
 * The page wrappers (`<HomepageAnalytics>`, `<SponsorsAnalytics>`) own banners,
 * identity buttons, `sponsor_view` and the CTA, and no longer look at a sponsor
 * marker — so a click is handled here and nowhere else.
 *
 * `contents` keeps the wrapper out of layout: it generates no box, so the wall
 * renders exactly as before.
 */
export function SponsorWallTracker({
  source,
  children,
}: SponsorWallTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    trackSponsorClick,
    trackSponsorFeaturedClick,
    trackSponsorImpression,
  } = useSponsorAnalytics();

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const timers = new Map<Element, ReturnType<typeof setTimeout>>();
    const inView = new Set<Element>();
    const fired = new Set<string>();

    const stop = (el: Element) => {
      clearTimeout(timers.get(el));
      timers.delete(el);
    };
    const start = (el: Element) => {
      if (timers.has(el)) return;
      timers.set(
        el,
        setTimeout(() => {
          timers.delete(el);
          inView.delete(el);
          observer.unobserve(el);
          const sponsor = readSponsorAttrs(el as HTMLElement);
          if (!sponsor || fired.has(sponsor.sponsorId)) return;
          fired.add(sponsor.sponsorId);
          trackSponsorImpression({ ...sponsor, source });
        }, DWELL_MS),
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting, intersectionRatio } of entries) {
          // `isIntersecting` stays true below the threshold; the ratio is the cut.
          if (isIntersecting && intersectionRatio >= IMPRESSION_THRESHOLD) {
            inView.add(target);
            if (!document.hidden) start(target);
          } else {
            inView.delete(target);
            stop(target);
          }
        }
      },
      { threshold: IMPRESSION_THRESHOLD },
    );

    const onVisibility = () => {
      if (document.hidden) timers.forEach((_, el) => stop(el));
      else inView.forEach(start);
    };

    node
      .querySelectorAll("[data-sponsor-id]")
      .forEach((el) => observer.observe(el));
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, [source, trackSponsorImpression]);

  useDelegatedClick(ref, {
    selector: "[data-sponsor-id]",
    onMatch: (el) => {
      // An unlinked tile carries the markers too, for its impression; it has
      // nowhere to go, so it is no click.
      if (el.tagName !== "A") return;
      const sponsor = readSponsorAttrs(el);
      if (!sponsor) return;

      if (el.hasAttribute("data-sponsor-featured")) {
        trackSponsorFeaturedClick({ ...sponsor, source });
      } else {
        trackSponsorClick({ ...sponsor, source });
      }
    },
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
