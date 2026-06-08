/**
 * SponsorsPage — Phase 7 tracer.
 *
 * Editorial header (MonoLabel kicker + EditorialHeading) over a cream
 * `<SponsorTile>` grid of all sponsors. Replaces the legacy dark-header +
 * `SectionStack`/`diagonal` composition. Tier bodies, the featured marquee and
 * the CTA band land in later phases (see docs/prd/redesign-phase-7-sponsors.md).
 */

import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { SponsorTile, SPONSOR_TILE_GRID_CLASS } from "../SponsorTile";
import type { Sponsor } from "../Sponsors";

export interface SponsorsPageProps {
  /** All sponsors across every tier, already ordered for display. */
  sponsors: Sponsor[];
}

export function SponsorsPage({ sponsors }: SponsorsPageProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-10 flex flex-col gap-3">
        <span>
          <MonoLabel variant="plain">KCVV Elewijt</MonoLabel>
        </span>
        <EditorialHeading level={1} size="display-2xl" emphasis={{ text: "." }}>
          Onze sponsors
        </EditorialHeading>
        <p className="font-display text-ink-muted text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic">
          KCVV Elewijt kan rekenen op de steun van lokale en regionale partners.
        </p>
      </header>

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
