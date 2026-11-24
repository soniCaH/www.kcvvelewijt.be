import type { SponsorTier } from "@/hooks/useSponsorAnalytics";

export interface SponsorAttrs {
  sponsorId: string;
  tier?: SponsorTier;
}

/**
 * Read the inert markers `<SponsorTile>` / `<HoofdSponsorTile>` and the links
 * of `<TeamSponsorLine>` emit off a delegated click target, or `null` when the
 * element carries no sponsor id.
 *
 * Two readers: `<SponsorWallTracker>` (#3649) for the wall on the homepage
 * (#2400), `/sponsors` and team pages, and `<TeamSponsorLineTracker>` (#3652)
 * for the "Gesteund door" line; the attribute names and the empty-string
 * coercion live here beside the type.
 */
export function readSponsorAttrs(el: HTMLElement): SponsorAttrs | null {
  const sponsorId = el.getAttribute("data-sponsor-id");
  if (!sponsorId) return null;
  return {
    sponsorId,
    tier: (el.getAttribute("data-sponsor-tier") || undefined) as
      SponsorTier | undefined,
  };
}
