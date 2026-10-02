/**
 * SponsorsPage — Phase 7.
 *
 * Split `<SponsorHero>` (Merci headline + "In de kijker" marquee) → `<StripedSeam>`
 * → `<SponsorTiers>` (labelled Hoofdsponsors grid + one unlabelled merged wall)
 * → `<SponsorCtaBand>` (jersey-deep-dark footer invitation). With zero sponsors
 * the body collapses to a gracious tier-"surface" `<EmptyState>` (#2427 /
 * #2562) between the headline-only hero and the band — inlined here rather
 * than its own file: post-migration it was a 10-line pass-through with a
 * `className` prop nobody passed, and its one caller is this page. The
 * "Word sponsor" action lives in the band below, so this passes no `undo`.
 * Replaces the legacy dark-header + `SectionStack`/`diagonal` composition.
 */

import { StripedSeam } from "@/components/design-system/StripedSeam";
import { EmptyState, PageContainer } from "@/components/design-system";
import { SponsorHero } from "../SponsorHero";
import { SponsorTiers } from "../SponsorTiers";
import { SponsorCtaBand } from "../SponsorCtaBand";
import { SponsorsAnalytics } from "../SponsorsAnalytics";
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
    <SponsorsAnalytics>
      {/* Plain top (the hero opens the page); the bottom sits above the
          `<SponsorCtaBand>` seam, so it gives one step back (#3306). */}
      <PageContainer width="index" className="pt-12 pb-10 sm:pt-16 sm:pb-14">
        <SponsorHero featured={featured} />

        {hasSponsors ? (
          <>
            <div className="mb-10 sm:mb-12">
              <StripedSeam colorPair="ink-cream" height="md" />
            </div>
            {/* The Hoofdsponsors run label is an <h3>; without this h2 the
                outline jumps h1 → h3 (axe `heading-order`). sr-only because
                the page opener already names the section visually (#3334). */}
            <h2 className="sr-only">Onze sponsors</h2>
            <SponsorTiers sponsors={sponsors} />
          </>
        ) : (
          <EmptyState tier="surface" heading="Nog geen sponsors">
            We zoeken partners die mee de plezantste compagnie willen dragen —
            jouw zaak kan de eerste langs de lijn zijn.
          </EmptyState>
        )}
      </PageContainer>

      <SponsorCtaBand />
    </SponsorsAnalytics>
  );
}
