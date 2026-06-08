import Image from "next/image";
import Link from "next/link";
import { TapedCard } from "@/components/design-system/TapedCard";
import { formatSponsorAlt } from "../formatSponsorAlt";
import type { Sponsor } from "../Sponsors";

export interface HoofdSponsorTileProps {
  sponsor: Sponsor;
}

/**
 * <HoofdSponsorTile> — a large taped tile for the labelled "Hoofdsponsors"
 * group on `/sponsors` (7.d3). A cream-soft `<TapedCard>` (auto per-slot
 * rotation from `<TapedCardGrid>`) holding a greyscale logo that resolves to
 * colour on hover/focus — or an italic-display wordmark fallback when there is
 * no logo — over an italic-display name caption.
 *
 * Clickable when `url` is present: the card becomes an external link with a
 * jersey-deep focus ring and the canonical paper press-down on hover. Without a
 * `url` it renders as a static taped tile (no press, logo stays greyscale —
 * mirrors `<SponsorTile>`).
 */
export function HoofdSponsorTile({ sponsor }: HoofdSponsorTileProps) {
  const tile = (
    <TapedCard
      rotation="auto"
      bg="cream-soft"
      shadow="sm"
      padding="none"
      interactive={sponsor.url ? "press" : false}
      className="px-3 pt-4 pb-2.5 text-center"
    >
      <div className="flex min-h-[56px] items-center justify-center">
        {sponsor.logo ? (
          <Image
            src={sponsor.logo}
            alt={formatSponsorAlt(sponsor.name)}
            width={220}
            height={88}
            className="h-auto max-h-[56px] w-auto max-w-full object-contain grayscale transition-all duration-300 ease-out group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none"
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 30vw"
          />
        ) : (
          <span className="font-display text-ink line-clamp-2 text-lg italic">
            {sponsor.name}
          </span>
        )}
      </div>
      <p className="font-display text-ink mt-2 text-sm italic">
        {sponsor.name}
      </p>
    </TapedCard>
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
}
