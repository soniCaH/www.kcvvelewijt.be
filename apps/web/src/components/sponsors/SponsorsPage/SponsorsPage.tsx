/**
 * SponsorsPage — Phase 7.
 *
 * Split `<SponsorHero>` (Merci headline + "In de kijker" marquee) over a cream
 * `<SponsorTile>` grid of all sponsors. Replaces the legacy dark-header +
 * `SectionStack`/`diagonal` composition. Tier bodies and the CTA band land in
 * later phases (see docs/prd/redesign-phase-7-sponsors.md).
 */

import { SponsorHero } from "../SponsorHero";
import { SponsorTile, SPONSOR_TILE_GRID_CLASS } from "../SponsorTile";
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
        <ul className={SPONSOR_TILE_GRID_CLASS}>
          {sponsors.map((sponsor) => (
            <li key={sponsor.id}>
              <SponsorTile sponsor={sponsor} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
