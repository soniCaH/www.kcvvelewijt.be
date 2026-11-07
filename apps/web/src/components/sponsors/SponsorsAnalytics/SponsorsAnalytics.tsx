"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSponsorAnalytics } from "@/hooks/useSponsorAnalytics";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";

export interface SponsorsAnalyticsProps {
  children: ReactNode;
}

/**
 * Client analytics shell for the `/sponsors` page. Fires `sponsor_view` once on
 * mount and delegates the band button click to its data-attributed marker —
 * so the presentational components stay server-rendered.
 *
 * Marker (set by the component): `data-sponsor-cta` on the band button →
 * `sponsor_cta_click`. The tile and marquee clicks belong to
 * `<SponsorWallTracker>` (#3649), not to this wrapper. A native listener on
 * the container (not a JSX `onClick` on a non-interactive div) catches the
 * bubbled click from mouse and keyboard activation alike.
 */
export function SponsorsAnalytics({ children }: SponsorsAnalyticsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { trackSponsorView, trackSponsorCtaClick } = useSponsorAnalytics();

  useEffect(() => {
    trackSponsorView();
  }, [trackSponsorView]);

  useDelegatedClick(ref, {
    selector: "[data-sponsor-cta]",
    onMatch: () => {
      trackSponsorCtaClick();
    },
  });

  return <div ref={ref}>{children}</div>;
}
