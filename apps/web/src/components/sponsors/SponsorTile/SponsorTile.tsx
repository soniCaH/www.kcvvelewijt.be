import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatSponsorAlt } from "../formatSponsorAlt";
import type { Sponsor } from "../Sponsors";

export interface SponsorTileProps {
  sponsor: Sponsor;
  /**
   * `true` gives the cell a paper-card frame: a 1.5px ink border + a light
   * (ink-muted) offset shadow that presses down on hover when the tile links
   * out. Used by the `/sponsors` merged wall (7.d3) so the wall reads as cards —
   * one step lighter than the hoofd tiles' 2px border + hard-black shadow. The
   * homepage `<SponsorsBlock>` leaves it `false` (flat cells, unchanged).
   */
  framed?: boolean;
}

/**
 * Shared grid classes for any grid of `<SponsorTile>`s — kept in one place so
 * the homepage `<SponsorsBlock>`, the `/sponsors` page, and the loading
 * skeleton stay in lockstep (the skeleton must mirror the real grid).
 */
export const SPONSOR_TILE_GRID_CLASS =
  "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3.5";

/**
 * Shared sponsor logo tile — a cream-soft cell holding a greyscale logo that
 * resolves to colour on hover/focus, an italic Freight Display wordmark
 * fallback when the sponsor has no logo, and an optional external link
 * (jersey-deep focus ring) when `url` is present.
 *
 * Consumed by the homepage `<SponsorsBlock>` (flat) and the `/sponsors` merged
 * wall (`framed`) so both surfaces share one tile vocabulary.
 */
export const SponsorTile = ({ sponsor, framed = false }: SponsorTileProps) => {
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
    <div
      className={cn(
        "bg-cream-soft flex min-h-[70px] items-center justify-center px-3.5 py-2",
        framed && "border-ink shadow-paper-sm-soft border-[1.5px]",
        // Canonical press-down only when the framed tile is itself a link —
        // the shadow then collapses flush as the cell shifts into it on hover.
        framed &&
          sponsor.url &&
          "transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none",
      )}
    >
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
