/**
 * SponsorGrid Component
 *
 * Responsive grid of SponsorCard items.
 * Mirrors the column/size API of the existing Sponsors component but
 * delegates individual card rendering to SponsorCard.
 */

import { cn } from "@/lib/utils/cn";
import { SponsorCard } from "../SponsorCard/SponsorCard";
import type { Sponsor } from "../Sponsors";

const gridColsClass: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

export interface SponsorGridProps {
  /** Sponsors to display */
  sponsors: Sponsor[];
  /** Number of columns */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Card size */
  size?: "sm" | "md" | "lg";
  /** Show sponsor names below logos */
  showNames?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const SponsorGrid = ({
  sponsors,
  columns = 4,
  size = "md",
  showNames = false,
  className,
}: SponsorGridProps) => {
  if (sponsors.length === 0) return null;

  return (
    <div className={cn("grid gap-3", gridColsClass[columns], className)}>
      {sponsors.map((sponsor) => (
        <SponsorCard
          key={sponsor.id}
          sponsor={sponsor}
          size={size}
          showName={showNames}
        />
      ))}
    </div>
  );
};
