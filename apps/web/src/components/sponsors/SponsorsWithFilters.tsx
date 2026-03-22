/**
 * SponsorsWithFilters Component
 * Client-side wrapper that handles filtering and sorting of sponsors
 */

"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { SponsorsFilters, type FilterState } from "./SponsorsFilters";
import { SponsorsTier, type SponsorTier } from "./SponsorsTier";
import { TierDivider } from "./TierDivider";
import { SponsorEmptyState } from "./SponsorEmptyState";
import type { Sponsor } from "./Sponsors";

export interface SponsorsWithFiltersProps {
  /**
   * Gold tier sponsors
   */
  goldSponsors: Sponsor[];
  /**
   * Silver tier sponsors
   */
  silverSponsors: Sponsor[];
  /**
   * Bronze tier sponsors
   */
  bronzeSponsors: Sponsor[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface SponsorWithTier extends Sponsor {
  tier: SponsorTier;
}

export const SponsorsWithFilters = ({
  goldSponsors,
  silverSponsors,
  bronzeSponsors,
  className,
}: SponsorsWithFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    tier: "all",
    search: "",
    sort: "tier",
  });

  // Combine all sponsors with tier information
  const allSponsors: SponsorWithTier[] = useMemo(
    () => [
      ...goldSponsors.map((s) => ({ ...s, tier: "gold" as const })),
      ...silverSponsors.map((s) => ({ ...s, tier: "silver" as const })),
      ...bronzeSponsors.map((s) => ({ ...s, tier: "bronze" as const })),
    ],
    [goldSponsors, silverSponsors, bronzeSponsors],
  );

  // Filter and sort sponsors
  const filteredSponsors = useMemo(() => {
    let result = [...allSponsors];

    // Filter by tier
    if (filters.tier !== "all") {
      result = result.filter((s) => s.tier === filters.tier);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(searchLower));
    }

    // Sort
    if (filters.sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Sort by tier (gold -> silver -> bronze)
      const tierOrder = { gold: 1, silver: 2, bronze: 3 };
      result.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
    }

    return result;
  }, [allSponsors, filters]);

  // Group filtered sponsors back into tiers
  const filteredByTier = useMemo(() => {
    const gold = filteredSponsors.filter((s) => s.tier === "gold");
    const silver = filteredSponsors.filter((s) => s.tier === "silver");
    const bronze = filteredSponsors.filter((s) => s.tier === "bronze");
    return { gold, silver, bronze };
  }, [filteredSponsors]);

  const totalCount = allSponsors.length;
  const hasSponsors = totalCount > 0;

  if (!hasSponsors) {
    return <SponsorEmptyState />;
  }

  return (
    <div className={cn("", className)}>
      <SponsorsFilters
        onFilterChange={setFilters}
        totalCount={totalCount}
        filteredCount={filteredSponsors.length}
      />

      {filteredSponsors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-30">🔍</div>
          <h3 className="text-xl font-bold text-kcvv-gray-blue mb-2">
            Geen sponsors gevonden
          </h3>
          <p className="text-gray-600">
            Probeer een andere zoekopdracht of filter.
          </p>
        </div>
      ) : (
        <>
          <SponsorsTier
            tier="gold"
            title="Gouden Sponsors"
            sponsors={filteredByTier.gold}
          />
          {filteredByTier.gold.length > 0 &&
            filteredByTier.silver.length > 0 && <TierDivider />}
          <SponsorsTier
            tier="silver"
            title="Zilveren Sponsors"
            sponsors={filteredByTier.silver}
          />
          {filteredByTier.silver.length > 0 &&
            filteredByTier.bronze.length > 0 && <TierDivider />}
          <SponsorsTier
            tier="bronze"
            title="Bronzen Sponsors"
            sponsors={filteredByTier.bronze}
          />
        </>
      )}
    </div>
  );
};
