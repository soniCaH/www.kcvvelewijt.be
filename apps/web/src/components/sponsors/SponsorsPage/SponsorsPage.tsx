/**
 * SponsorsPage — Phase 7.
 *
 * Split `<SponsorHero>` (Merci headline + "In de kijker" marquee) → `<StripedSeam>`
 * → `<SponsorTiers>` (labelled Hoofdsponsors grid + one unlabelled merged wall).
 * Replaces the legacy dark-header + `SectionStack`/`diagonal` composition. The
 * CTA band + full empty states land in later phases (see
 * docs/prd/redesign-phase-7-sponsors.md).
 */

import { StripedSeam } from "@/components/design-system/StripedSeam";
import { SponsorHero } from "../SponsorHero";
import { SponsorTiers } from "../SponsorTiers";
import { selectFeaturedSponsor } from "../selectFeaturedSponsor";
import type { Sponsor } from "../Sponsors";

export interface SponsorsPageProps {
  /** All sponsors across every tier, already ordered for display. */
  sponsors: Sponsor[];
}

export function SponsorsPage({ sponsors }: SponsorsPageProps) {
  const featured = selectFeaturedSponsor(sponsors);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <SponsorHero featured={featured} />

      {sponsors.length > 0 && (
        <>
          <div className="mb-10 sm:mb-12">
            <StripedSeam colorPair="ink-cream" height="md" />
          </div>
          <SponsorTiers sponsors={sponsors} />
        </>
      )}
    </div>
  );
}
