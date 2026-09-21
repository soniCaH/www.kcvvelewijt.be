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
 *
 * `<SponsorTiers>` is #2623's named adoption site for `<SectionWipeReveal>`
 * (M4, the squeegee wipe) — the wall sits below the fold on first paint on
 * every viewport this page ships, so it is a real scroll-entry candidate
 * rather than a component already in view at mount. See #2623's PR for why
 * this is the only call site this branch adopts.
 */

import { StripedSeam } from "@/components/design-system/StripedSeam";
import {
  EmptyState,
  PageContainer,
  SectionWipeReveal,
} from "@/components/design-system";
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
      <PageContainer width="index" className="py-12 sm:py-16">
        <SponsorHero featured={featured} />

        {hasSponsors ? (
          <>
            <div className="mb-10 sm:mb-12">
              <StripedSeam colorPair="ink-cream" height="md" />
            </div>
            <SectionWipeReveal>
              <SponsorTiers sponsors={sponsors} />
            </SectionWipeReveal>
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
