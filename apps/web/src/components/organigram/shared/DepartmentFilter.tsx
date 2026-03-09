"use client";

/**
 * DepartmentFilter Component (Migrated to FilterTabs)
 *
 * Department selection filter using the unified FilterTabs component.
 * This is now a thin wrapper around FilterTabs for backward compatibility.
 *
 * Features:
 * - Three options: All, Hoofdbestuur, Jeugdbestuur
 * - Member counts per department
 * - Consistent styling with FilterTabs across the app
 * - Mobile-responsive with horizontal scrolling
 */

import { useMemo } from "react";
import {
  FilterTabs,
  type FilterTab,
} from "@/components/design-system/FilterTabs";
import type { DepartmentFilterProps } from "./types";

/**
 * Render a department filter as tabs with optional member counts.
 *
 * Computes counts for the three tabs: "Alle" (total members), "Hoofdbestuur" (members whose department is "hoofdbestuur" or "algemeen"), and "Jeugdbestuur" (members whose department is "jeugdbestuur").
 *
 * @param value - The currently active department key ("all" | "hoofdbestuur" | "jeugdbestuur")
 * @param onChange - Called when the active tab changes with the new department key
 * @param members - Array of members used to derive per-tab counts
 * @param showCounts - Whether to display member counts next to each tab
 * @param variant - DEPRECATED: legacy prop kept for backward compatibility; use `size` instead
 * @param size - Size variant for the tabs ("sm" | "md" | "lg")
 * @param className - Additional CSS class names applied to the tabs container
 * @returns The FilterTabs element configured for department filtering
 */
export function DepartmentFilter({
  value,
  onChange,
  members,
  showCounts = true,
  variant,
  size = "md",
  className = "",
}: DepartmentFilterProps) {
  // Calculate tabs with member counts
  const tabs: FilterTab[] = useMemo(
    () => [
      {
        value: "all",
        label: "Alle",
        count: members.length,
      },
      {
        value: "hoofdbestuur",
        label: "Hoofdbestuur",
        count: members.filter(
          (m) => m.department === "hoofdbestuur" || m.department === "algemeen",
        ).length,
      },
      {
        value: "jeugdbestuur",
        label: "Jeugdbestuur",
        count: members.filter((m) => m.department === "jeugdbestuur").length,
      },
    ],
    [members],
  );

  // Map variant to size if provided (backward compatibility)
  const effectiveSize = variant ? "md" : size;

  // Type-safe onChange handler
  const handleChange = (newValue: string) => {
    onChange(newValue as "all" | "hoofdbestuur" | "jeugdbestuur");
  };

  return (
    <FilterTabs
      tabs={tabs}
      activeTab={value}
      onChange={handleChange}
      size={effectiveSize}
      showCounts={showCounts}
      className={className}
      ariaLabel="Filter by department"
    />
  );
}
