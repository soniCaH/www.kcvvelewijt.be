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
import { Search, Newspaper, User, UserCog, Users } from "lucide-react";

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
  const tabs: FilterTab[] = useMemo(
    () => [
      {
        value: "all",
        label: "Alles",
        icon: Search,
        count: resultCounts.all,
      },
      {
        value: "article",
        label: "Nieuws",
        icon: Newspaper,
        count: resultCounts.article,
      },
      {
        value: "player",
        label: "Spelers",
        icon: User,
        count: resultCounts.player,
      },
      {
        value: "staff",
        label: "Staf",
        icon: UserCog,
        count: resultCounts.staff,
      },
      {
        value: "team",
        label: "Teams",
        icon: Users,
        count: resultCounts.team,
      },
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
