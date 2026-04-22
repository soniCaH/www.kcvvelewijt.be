/**
 * SponsorCard Component
 *
 * Individual sponsor display with logo, optional name, and link to website.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatSponsorAlt } from "../formatSponsorAlt";
import type { Sponsor } from "../Sponsors";

const sizeMap = {
  sm: { image: { width: 120, height: 80 } },
  md: { image: { width: 200, height: 133 } },
  lg: { image: { width: 280, height: 187 } },
} as const;

export interface SponsorCardProps {
  /** Sponsor data */
  sponsor: Sponsor;
  /** Card size */
  size?: "sm" | "md" | "lg";
  /** Show sponsor name below the logo */
  showName?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const SponsorCard = ({
  sponsor,
  size = "md",
  showName = false,
  className,
}: SponsorCardProps) => {
  const { image } = sizeMap[size];

  const card = (
    <div
      className={cn(
        "group rounded-card relative flex aspect-[3/2] items-center justify-center overflow-hidden",
        "p-[8%]",
        className,
      )}
    >
      <Image
        src={sponsor.logo}
        alt={formatSponsorAlt(sponsor.name)}
        width={image.width}
        height={image.height}
        className="h-full w-full object-contain grayscale transition-all duration-300 group-hover:grayscale-0"
      />
    </div>
  );

  return (
    <div>
      {sponsor.url ? (
        <Link
          href={sponsor.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Bezoek de website van ${sponsor.name}`}
        >
          {card}
        </Link>
      ) : (
        card
      )}
      {showName && (
        <p className="mt-2 text-center text-xs font-medium text-gray-600">
          {sponsor.name}
        </p>
      )}
    </div>
  );
};
