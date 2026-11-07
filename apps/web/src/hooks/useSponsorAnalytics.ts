import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { hashMemberId } from "@/lib/analytics/hash-member-id";

export type SponsorTier = "hoofdsponsor" | "sponsor" | "sympathisant";

interface SponsorClickInput {
  /** Internal Sanity sponsor id — hashed before it leaves the client. */
  sponsorId: string;
  tier?: SponsorTier;
  /**
   * Which surface the tile sat on — `homepage` for `<SponsorsBlock>`, omitted
   * on `/sponsors` (#2400). Set by `<SponsorWallTracker>` (#3649). Without it the two surfaces are indistinguishable
   * in GA4 and neither can be judged on its own.
   */
  source?: "homepage";
}

/**
 * Analytics for the `/sponsors` page (PRD redesign-phase-7 §6):
 * `sponsor_view` (page view), `sponsor_click` (any tier/wall tile),
 * `sponsor_featured_click` (the "In de kijker" marquee) and `sponsor_cta_click`
 * (the "Word sponsor +" band button).
 *
 * No PII: the internal Sanity sponsor id is hashed via `hashMemberId`, never
 * sent raw; sponsor `url`s are never sent.
 */
export function useSponsorAnalytics() {
  const trackSponsorView = useCallback(() => {
    trackEvent("sponsor_view");
  }, []);

  const trackSponsorClick = useCallback(
    ({ sponsorId, tier, source }: SponsorClickInput) => {
      trackEvent("sponsor_click", {
        sponsor_id: hashMemberId(sponsorId),
        ...(tier ? { tier } : {}),
        ...(source ? { source } : {}),
      });
    },
    [],
  );

  const trackSponsorFeaturedClick = useCallback(
    ({ sponsorId, tier }: SponsorClickInput) => {
      trackEvent("sponsor_featured_click", {
        sponsor_id: hashMemberId(sponsorId),
        ...(tier ? { tier } : {}),
      });
    },
    [],
  );

  const trackSponsorCtaClick = useCallback(() => {
    trackEvent("sponsor_cta_click");
  }, []);

  return {
    trackSponsorView,
    trackSponsorClick,
    trackSponsorFeaturedClick,
    trackSponsorCtaClick,
  };
}
