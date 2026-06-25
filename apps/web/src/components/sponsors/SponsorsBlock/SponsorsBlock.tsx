import Link from "next/link";
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
        />

        <ul className={cn("mt-8", SPONSOR_TILE_GRID_CLASS)}>
          {visible.map((sponsor) => (
            <li key={sponsor.id}>
              <SponsorTile sponsor={sponsor} />
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-end">
          <Link
            href="/sponsors"
            className="text-ink hover:text-jersey-deep inline-flex items-center gap-1 font-mono text-sm font-bold tracking-wide uppercase underline-offset-4 hover:underline"
          >
            Alle sponsors &amp; sympathisanten →
          </Link>
        </div>
      </PageContainer>
    </section>
  );
};
