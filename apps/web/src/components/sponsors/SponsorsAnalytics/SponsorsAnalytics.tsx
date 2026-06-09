"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  useSponsorAnalytics,
  type SponsorTier,
} from "@/hooks/useSponsorAnalytics";

export interface SponsorsAnalyticsProps {
  children: ReactNode;
}

/**
 * Client analytics shell for the `/sponsors` page. Fires `sponsor_view` once on
 * mount and delegates clicks to the data-attributed sponsor links/buttons
 * rendered by the (server) tiles below — so the presentational components stay
 * server-rendered and the homepage `<SponsorTile>` (no wrapper) is unaffected.
 *
 * Markers (set by the components): `data-sponsor-id` + `data-sponsor-tier` on a
 * tile link → `sponsor_click`; the same plus `data-sponsor-featured` on the
 * marquee link → `sponsor_featured_click`; `data-sponsor-cta` on the band button
 * → `sponsor_cta_click`. A native listener on the container (not a JSX `onClick`
 * on a non-interactive div) catches the bubbled click from mouse and keyboard
 * activation alike.
 */
export function SponsorsAnalytics({ children }: SponsorsAnalyticsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    trackSponsorView,
    trackSponsorClick,
    trackSponsorFeaturedClick,
    trackSponsorCtaClick,
  } = useSponsorAnalytics();

  useEffect(() => {
    trackSponsorView();
  }, [trackSponsorView]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(
        "[data-sponsor-id], [data-sponsor-cta]",
      );
      if (!el) return;

      if (el.hasAttribute("data-sponsor-cta")) {
        trackSponsorCtaClick();
        return;
      }

      const sponsorId = el.getAttribute("data-sponsor-id");
      if (!sponsorId) return;
      const tier = (el.getAttribute("data-sponsor-tier") || undefined) as
        | SponsorTier
        | undefined;

      if (el.hasAttribute("data-sponsor-featured")) {
        trackSponsorFeaturedClick({ sponsorId, tier });
      } else {
        trackSponsorClick({ sponsorId, tier });
      }
    };

    node.addEventListener("click", handleClick);
    return () => node.removeEventListener("click", handleClick);
  }, [trackSponsorClick, trackSponsorFeaturedClick, trackSponsorCtaClick]);

  return <div ref={ref}>{children}</div>;
}
