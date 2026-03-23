/**
 * SponsorCard Component
 *
 * Individual sponsor display with logo, optional name, and link to website.
 * Hover reveals a "Bezoek website" overlay matching the existing Sponsors pattern.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
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
  /** Theme variant */
  variant?: "light" | "dark";
  /** Show sponsor name below the logo */
  showName?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const SponsorCard = ({
  sponsor,
  size = "md",
  variant = "light",
  showName = false,
  className,
}: SponsorCardProps) => {
  const { image } = sizeMap[size];

  const card = (
    <div
      className={cn(
        "group relative aspect-[3/2] rounded flex items-center justify-center overflow-hidden",
        "opacity-70 hover:opacity-100 transition-opacity duration-300",
        "p-[8%]",
        variant === "dark" ? "bg-white/15" : "bg-gray-100",
        className,
      )}
    >
      <Image
        src={sponsor.logo}
        alt={sponsor.name}
        width={image.width}
        height={image.height}
        className="w-full h-full object-contain"
      />

      {/* Hover overlay */}
      {sponsor.url && (
        <div
          className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        >
          <span className="text-white text-xs font-semibold uppercase tracking-wide">
            Bezoek website
          </span>
        </div>
      )}
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
        <p className="text-center text-xs text-gray-600 mt-2 font-medium">
          {sponsor.name}
        </p>
      )}
    </div>
  );
};
