"use client";

/**
 * CategoryFilters Component (Migrated to FilterTabs)
 *
 * News category filter using the unified FilterTabs component.
 * Renders as Next.js Links for client-side navigation.
 *
 * This is now a thin wrapper around FilterTabs for consistency
 * across all filter components in the application.
 */

import { useMemo } from "react";
import {
  FilterTabs,
  type FilterTab,
} from "@/components/design-system/FilterTabs";

interface Category {
  id: string;
  attributes: {
    name: string;
    slug: string;
  };
}

interface CategoryFiltersProps {
  categories: Category[];
  activeCategory?: string;
  showCounts?: boolean;
  renderAsLinks?: boolean;
  onChange?: (category: string) => void;
  /** Slug of the category whose fetch is pending — its chip shows the dots. */
  pendingCategory?: string;
}

/**
 * Render a horizontally scrollable set of category filter tabs for the news listing.
 *
 * Converts the provided categories into tabs (including a default "Alles" tab) and delegates
 * rendering and navigation to the shared FilterTabs component.
 *
 * @param categories - Array of category objects to create tabs from
 * @param activeCategory - Slug of the currently active category; defaults to `"all"` when not provided
 * @param showCounts - Whether to display article counts for each category
 * @param renderAsLinks - When `true`, tabs render as links with hrefs; when `false`, tabs render as interactive buttons
 * @param onChange - Callback invoked with the selected category slug when `renderAsLinks` is `false`
 * @param pendingCategory - Slug (or `"all"`) of the chip whose fetch is pending; it shows the compact dots
 * @returns A React element containing the category filter tabs
 */
export function CategoryFilters({
  categories,
  activeCategory,
  showCounts = false,
  renderAsLinks = true,
  onChange,
  pendingCategory,
}: CategoryFiltersProps) {
  // Convert categories to FilterTab format with hrefs for Next.js routing
  const tabs: FilterTab[] = useMemo(() => {
    const allTab: FilterTab = {
      value: "all",
      label: "Alles",
      href: "/nieuws",
    };

    const categoryTabs: FilterTab[] = categories.map((category) => ({
      value: category.attributes.slug,
      label: category.attributes.name,
      href: `/nieuws?categorie=${encodeURIComponent(category.attributes.slug)}`,
    }));

    return [allTab, ...categoryTabs];
  }, [categories]);

  return (
    <FilterTabs
      tabs={tabs}
      activeTab={activeCategory || "all"}
      showCounts={showCounts}
      renderAsLinks={renderAsLinks}
      onChange={onChange}
      pendingTab={pendingCategory}
      ariaLabel="Filter news by category"
    />
  );
}
