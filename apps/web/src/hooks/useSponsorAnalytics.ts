import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { hashMemberId } from "@/lib/analytics/hash-member-id";

export type SponsorTier = "hoofdsponsor" | "sponsor" | "sympathisant";

export type SponsorSource = "homepage" | "sponsors" | "team";

interface SponsorClickInput {
  /** Internal Sanity sponsor id — hashed before it leaves the client. */
  sponsorId: string;
  tier?: SponsorTier;
  /**
   * Which surface the tile sat on — `homepage` for `<SponsorsBlock>`,
   * `sponsors` on `/sponsors`, `team` on a team page. Set by `<SponsorWallTracker>` (#3649, #3650).
   * Without it the surfaces are indistinguishable in GA4 and none can be
   * judged on its own.
   */
  source?: SponsorSource;
}

/**
 * Analytics for the `/sponsors` page (PRD redesign-phase-7 §6):
 * `sponsor_view` (page view), `sponsor_click` (any tier/wall tile),
 * `sponsor_featured_click` (the "In de kijker" marquee), `sponsor_impression`
 * (a tile seen for 1 s), `sponsor_team_line_click` (a name on a team page's
 * "Gesteund door" line), `sponsor_cta_click` (the "Word sponsor +" band
 * button) and `sponsor_packages_view` (the package explainer's heading, intro
 * and bundle cards 40% in view, fired by `<TrackInView>`, not here).
 *
 * No PII: the internal Sanity sponsor id is hashed via `hashMemberId`, never
 * sent raw; sponsor `url`s are never sent.
 */
export const useSponsorAnalytics = () => {
  const trackSponsorView = useCallback(() => {
    trackEvent("sponsor_view");
  }, []);

  const send = useCallback(
    (eventName: string, { sponsorId, tier, source }: SponsorClickInput) => {
      trackEvent(eventName, {
        sponsor_id: hashMemberId(sponsorId),
        ...(tier ? { tier } : {}),
        ...(source ? { source } : {}),
      });
    },
    [],
  );

  const trackSponsorClick = useCallback(
    (input: SponsorClickInput) => send("sponsor_click", input),
    [send],
  );

  const trackSponsorFeaturedClick = useCallback(
    (input: SponsorClickInput) => send("sponsor_featured_click", input),
    [send],
  );

  /** One Sponsor's logo was seen: half visible for 1 s, tab visible (#3650). */
  const trackSponsorImpression = useCallback(
    (input: SponsorClickInput) => send("sponsor_impression", input),
    [send],
  );

  /** A Sponsor's name on a team page's "Gesteund door" line was clicked (#3652). */
  const trackSponsorTeamLineClick = useCallback(
    ({ sponsorId, teamSlug }: { sponsorId: string; teamSlug: string }) =>
      trackEvent("sponsor_team_line_click", {
        sponsor_id: hashMemberId(sponsorId),
        team_slug: teamSlug,
      }),
    [],
  );

  const trackSponsorCtaClick = useCallback(() => {
    trackEvent("sponsor_cta_click");
  }, []);

  return {
    trackSponsorView,
    trackSponsorClick,
    trackSponsorFeaturedClick,
    trackSponsorImpression,
    trackSponsorTeamLineClick,
    trackSponsorCtaClick,
  };
};
