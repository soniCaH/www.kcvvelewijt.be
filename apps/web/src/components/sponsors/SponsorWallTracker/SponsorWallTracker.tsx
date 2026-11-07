"use client";

import { useRef, type ReactNode } from "react";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import { useSponsorAnalytics } from "@/hooks/useSponsorAnalytics";
import { readSponsorAttrs } from "@/lib/analytics/sponsor-attrs";

export interface SponsorWallTrackerProps {
  /**
   * The surface the wall sits on — `homepage` for `<SponsorsBlock>`, omitted on
   * `/sponsors`, exactly as the page wrappers sent it before (#3649).
   */
  source?: "homepage";
  children: ReactNode;
}

/**
 * The one click tracker for a sponsor wall (#3649). Reads the inert
 * `data-sponsor-id` / `data-sponsor-tier` markers `<SponsorTile>` and
 * `<HoofdSponsorTile>` emit → `sponsor_click`; the same plus
 * `data-sponsor-featured` on the marquee link → `sponsor_featured_click`.
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
  const { trackSponsorClick, trackSponsorFeaturedClick } =
    useSponsorAnalytics();

  useDelegatedClick(ref, {
    selector: "[data-sponsor-id]",
    onMatch: (el) => {
      const sponsor = readSponsorAttrs(el);
      if (!sponsor) return;

      if (el.hasAttribute("data-sponsor-featured")) {
        trackSponsorFeaturedClick(sponsor);
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
