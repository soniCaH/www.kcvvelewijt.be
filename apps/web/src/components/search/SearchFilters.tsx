"use client";

/**
 * SearchFilters Component
 * Content type filters for search results using FilterTabs
 */

import { useMemo } from "react";
import { SearchResultType } from "./SearchInterface";
import {
  FilterTabs,
  type FilterTab,
} from "@/components/design-system/FilterTabs";

export interface SearchFiltersProps {
  /**
   * Active filter type
   */
  activeType: SearchResultType | "all";
  /**
   * Callback when filter changes
   */
  onFilterChange: (type: SearchResultType | "all") => void;
  /**
   * Result counts per type
   */
  resultCounts: {
    all: number;
    article: number;
    player: number;
    staff: number;
    team: number;
  };
}

/**
 * Search type filters using the unified FilterTabs component
 */
export const SearchFilters = ({
  activeType,
  onFilterChange,
  resultCounts,
}: SearchFiltersProps) => {
  // FilterTab.icon retired with Track B Direction D (closes #1573).
  const tabs: FilterTab[] = useMemo(
    () => [
      { value: "all", label: "Alles", count: resultCounts.all },
      { value: "article", label: "Nieuws", count: resultCounts.article },
      { value: "player", label: "Spelers", count: resultCounts.player },
      { value: "staff", label: "Staf", count: resultCounts.staff },
      { value: "team", label: "Teams", count: resultCounts.team },
    ],
    [resultCounts],
  );

  const handleChange = (value: string) => {
    onFilterChange(value as SearchResultType | "all");
  };

  return (
    <FilterTabs
      tabs={tabs}
      activeTab={activeType}
      onChange={handleChange}
      size="md"
      showCounts={true}
      renderAsLinks={false}
      ariaLabel="Filter search results by type"
    />
  );
};
