import { cn } from "@/lib/utils/cn";
import { PageContainer, SectionHeader } from "@/components/design-system";
import { SponsorTile, SPONSOR_TILE_GRID_CLASS } from "../SponsorTile";
import { sortByTierThenName } from "../sortByTierThenName";
import type { Sponsor } from "../Sponsors";

export interface SponsorsBlockProps {
  sponsors: Sponsor[];
  className?: string;
}

export const SponsorsBlock = ({ sponsors, className }: SponsorsBlockProps) => {
  // Deliberately uncapped, unlike the rest of the homepage spine (`<NewsGrid>`
  // 6, the agenda 5, `<FeaturedUitgelichtRow>` 3). Owner decision, #2405,
  // 2026-08-12: sponsors pay for the visibility, so truncating the wall is a
  // commercial call and not a layout one — and the list is already filtered to
  // the paying tiers below, so there is no long tail to trim.
  //
  // Not prose-only: `SponsorsBlock.test.tsx`'s "filters out sympathisant rows
  // and renders only hoofdsponsor + sponsor" counts the rendered `listitem`s
  // against the input, so any `slice()` added here turns it red.
  const visible = sponsors
    .filter((s) => s.tier === "hoofdsponsor" || s.tier === "sponsor")
    .slice()
    .sort(sortByTierThenName);

  if (visible.length === 0) return null;

  return (
    <section
      aria-label="Onze sponsors"
      className={cn("bg-cream-deep py-16 md:py-20", className)}
    >
      <PageContainer width="index">
        <SectionHeader
          title="Met dank aan onze sponsors"
          emphasis={{ text: "sponsors" }}
          linkText="Alle sponsors & sympathisanten"
          linkHref="/sponsors"
        />

        <ul className={cn("mt-8", SPONSOR_TILE_GRID_CLASS)}>
          {visible.map((sponsor) => (
            <li key={sponsor.id}>
              <SponsorTile sponsor={sponsor} />
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
};
