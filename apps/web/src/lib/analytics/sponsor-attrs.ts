import type { SponsorTier } from "@/hooks/useSponsorAnalytics";

export interface SponsorAttrs {
  sponsorId: string;
  tier?: SponsorTier;
}

/**
 * Read the inert markers `<SponsorTile>` / `<HoofdSponsorTile>` emit off a
 * delegated click target, or `null` when the element carries no sponsor id.
 *
 * Read by `<SponsorWallTracker>` (#3649) for the wall on the homepage (#2400),
 * `/sponsors` and team pages; the attribute names and the empty-string
 * coercion live here beside the type.
 */
export const readSponsorAttrs = (el: HTMLElement): SponsorAttrs | null => {
  const sponsorId = el.getAttribute("data-sponsor-id");
  if (!sponsorId) return null;
  return {
    sponsorId,
    tier: (el.getAttribute("data-sponsor-tier") || undefined) as
      SponsorTier | undefined,
  };
};
