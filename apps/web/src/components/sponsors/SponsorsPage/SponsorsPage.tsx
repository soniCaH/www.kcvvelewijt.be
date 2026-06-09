/**
 * SponsorsPage — Phase 7.
 *
 * Split `<SponsorHero>` (Merci headline + "In de kijker" marquee) → `<StripedSeam>`
 * → `<SponsorTiers>` (labelled Hoofdsponsors grid + one unlabelled merged wall)
 * → `<SponsorCtaBand>` (jersey-deep-dark footer invitation). With zero sponsors
 * the body collapses to a gracious `<SponsorEmptyState>` between the
 * headline-only hero and the band. Replaces the legacy dark-header +
 * `SectionStack`/`diagonal` composition.
 */

import { StripedSeam } from "@/components/design-system/StripedSeam";
import { SponsorHero } from "../SponsorHero";
import { SponsorTiers } from "../SponsorTiers";
import { SponsorEmptyState } from "../SponsorEmptyState";
import { SponsorCtaBand } from "../SponsorCtaBand";
import { selectFeaturedSponsor } from "../selectFeaturedSponsor";
import type { Sponsor } from "../Sponsors";

export interface SponsorsPageProps {
  /** All sponsors across every tier, already ordered for display. */
  sponsors: Sponsor[];
}

export function SponsorsPage({ sponsors }: SponsorsPageProps) {
  const featured = selectFeaturedSponsor(sponsors);
  const hasSponsors = sponsors.length > 0;

  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <SponsorHero featured={featured} />

        {hasSponsors ? (
          <>
            <div className="mb-10 sm:mb-12">
              <StripedSeam colorPair="ink-cream" height="md" />
            </div>
            <SponsorTiers sponsors={sponsors} />
          </>
        ) : (
          <SponsorEmptyState />
        )}
      </div>

      <SponsorCtaBand />
    </>
  );
}
