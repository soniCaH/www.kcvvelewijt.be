/**
 * SponsorLogo Component
 *
 * Pure sponsor logo image with optional link wrapper.
 * No card chrome or hover overlay — just the logo at a given size.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatSponsorAlt } from "../formatSponsorAlt";

const sizeMap = {
  xs: { width: 80, height: 53 },
  sm: { width: 120, height: 80 },
  md: { width: 200, height: 133 },
  lg: { width: 280, height: 187 },
} as const;

export interface SponsorLogoProps {
  /** Sponsor name (used as alt text) */
  name: string;
  /** Logo image URL */
  logo: string;
  /** Link to sponsor website */
  url?: string;
  /** Image size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

export const SponsorLogo = ({
  name,
  logo,
  url,
  size = "md",
  className,
}: SponsorLogoProps) => {
  const { width, height } = sizeMap[size];

  const img = (
    <Image
      src={logo}
      alt={formatSponsorAlt(name)}
      width={width}
      height={height}
      className={cn("object-contain", className)}
    />
  );

  if (url) {
    return (
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Bezoek de website van ${name}`}
      >
        {img}
      </Link>
    );
  }

  return img;
};
