"use client";

/**
 * BrowseContent — Stacks 6 CategorySections in CATEGORY_ORDER
 *
 * Used as the default view of the Hulp page when no search is active and
 * no question is selected.
 */

import type { ResponsibilityPath } from "@/types/responsibility";
import { CATEGORY_ORDER, type CategoryKey } from "./categoryMeta";
import { CategorySection } from "./CategorySection";

export interface BrowseContentProps {
  pathsByCategory: Record<CategoryKey, ResponsibilityPath[]>;
  onPathClick: (id: string) => void;
}

export function BrowseContent({
  pathsByCategory,
  onPathClick,
}: BrowseContentProps) {
  return (
    <div className="space-y-12">
      {CATEGORY_ORDER.map((category) => (
        <CategorySection
          key={category}
          category={category}
          paths={pathsByCategory[category]}
          onPathClick={onPathClick}
        />
      ))}
    </div>
  );
}
