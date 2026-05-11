import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { SectionHeader } from "@/components/design-system";
import { formatSponsorAlt } from "../formatSponsorAlt";
import type { Sponsor } from "../Sponsors";

export interface SponsorsBlockProps {
  sponsors: Sponsor[];
  className?: string;
}

const TIER_ORDER = { hoofdsponsor: 0, sponsor: 1, sympathisant: 2 } as const;

function sortByTierThenName(a: Sponsor, b: Sponsor): number {
  const ta = TIER_ORDER[a.tier ?? "sponsor"] ?? 1;
  const tb = TIER_ORDER[b.tier ?? "sponsor"] ?? 1;
  if (ta !== tb) return ta - tb;
  return a.name.localeCompare(b.name, "nl");
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
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeader title="Met dank aan onze sponsors" />

        <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3.5">
          {visible.map((sponsor) => (
            <li key={sponsor.id}>
              <SponsorTile sponsor={sponsor} />
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link
            href="/sponsors"
            className="text-ink hover:text-jersey-deep inline-flex items-center gap-1 font-mono text-sm font-bold tracking-wide uppercase underline-offset-4 hover:underline"
          >
            Alle sponsors &amp; sympathisanten →
          </Link>
        </div>
      </div>
    </section>
  );
};

interface SponsorTileProps {
  sponsor: Sponsor;
}

const SponsorTile = ({ sponsor }: SponsorTileProps) => {
  const inner = sponsor.logo ? (
    <Image
      src={sponsor.logo}
      alt={formatSponsorAlt(sponsor.name)}
      width={200}
      height={80}
      className="h-auto max-h-[54px] w-auto max-w-full object-contain grayscale transition-all duration-300 ease-out group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none"
      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
    />
  ) : (
    <span className="font-display text-ink/80 line-clamp-2 text-center text-sm italic">
      {sponsor.name}
    </span>
  );

  const tile = (
    <div className="bg-cream-soft flex min-h-[70px] items-center justify-center px-3.5 py-2">
      {inner}
    </div>
  );

  if (sponsor.url) {
    return (
      <Link
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Bezoek de website van ${sponsor.name}`}
        className="focus-visible:outline-jersey-deep group block focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {tile}
      </Link>
    );
  }

  return tile;
};
