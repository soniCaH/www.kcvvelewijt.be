import { MonoLabel } from "@/components/design-system/MonoLabel";
import { TapedCardGrid } from "@/components/design-system/TapedCardGrid";
import { HoofdSponsorTile } from "../HoofdSponsorTile";
import { SponsorTile, SPONSOR_TILE_GRID_CLASS } from "../SponsorTile";
import { sortByTierThenName } from "../sortByTierThenName";
import type { Sponsor } from "../Sponsors";

export interface SponsorTiersProps {
  /** All sponsors across every tier (any order — sorted internally). */
  sponsors: Sponsor[];
}

/**
 * <SponsorTiers> — the `/sponsors` body (7.d3). Two visual classes, not three:
 *
 * 1. **Hoofdsponsors** — the only labelled group: a MonoLabel kicker + paper-edge
 *    rule over a `<TapedCardGrid>` of large `<HoofdSponsorTile>`s.
 * 2. **The wall** — `sponsor` + `sympathisant` (and untiered) merged into one
 *    *unlabelled* dense `<SponsorTile>` grid, ordered `sponsor` → `sympathisant`
 *    → `name` (nl). No header, no tier label, no blurb.
 *
 * Empty branches: 0 hoofd → wall only; 0 wall → hoofd only. (The 0-sponsors
 * case is handled upstream — `<SponsorsPage>` only renders this when there are
 * sponsors.)
 */
export function SponsorTiers({ sponsors }: SponsorTiersProps) {
  const ordered = [...sponsors].sort(sortByTierThenName);
  const hoofd = ordered.filter((sponsor) => sponsor.tier === "hoofdsponsor");
  const wall = ordered.filter((sponsor) => sponsor.tier !== "hoofdsponsor");

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      {hoofd.length > 0 && (
        <section aria-label="Hoofdsponsors">
          <div className="mb-4 flex items-center gap-3">
            <MonoLabel variant="plain">Hoofdsponsors</MonoLabel>
            <span aria-hidden className="bg-paper-edge h-0.5 flex-1" />
          </div>
          <TapedCardGrid columns={3} gap="md" as="ul">
            {hoofd.map((sponsor) => (
              <HoofdSponsorTile key={sponsor.id} sponsor={sponsor} />
            ))}
          </TapedCardGrid>
        </section>
      )}

      {wall.length > 0 && (
        <ul className={SPONSOR_TILE_GRID_CLASS}>
          {wall.map((sponsor) => (
            <li key={sponsor.id}>
              <SponsorTile sponsor={sponsor} framed />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
