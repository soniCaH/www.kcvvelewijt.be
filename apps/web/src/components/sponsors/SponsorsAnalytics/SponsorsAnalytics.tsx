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
 * Markers (set by the components): `data-sponsor-cta` on the band button →
 * `sponsor_cta_click`; `data-sponsor-contact` on the package explainer's
 * mailto link → `sponsor_contact_click`. (`sponsor_packages_view` is the
 * explainer's own `<TrackInView>` around its top part.) The tile and marquee clicks belong to
 * `<SponsorWallTracker>` (#3649), not to this wrapper. A native listener on
 * the container (not a JSX `onClick` on a non-interactive div) catches the
 * bubbled click from mouse and keyboard activation alike.
 */
export function SponsorsAnalytics({ children }: SponsorsAnalyticsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { trackSponsorView, trackSponsorCtaClick, trackSponsorContactClick } =
    useSponsorAnalytics();

  useEffect(() => {
    trackSponsorView();
  }, [trackSponsorView]);

  useDelegatedClick(ref, {
    selector: "[data-sponsor-cta]",
    onMatch: () => {
      trackSponsorCtaClick();
    },
  });

  useDelegatedClick(ref, {
    selector: "[data-sponsor-contact]",
    onMatch: () => {
      trackSponsorContactClick();
    },
  });

  return <div ref={ref}>{children}</div>;
}
