/**
 * Category metadata for the Hulp page
 *
 * Maps the 6 ResponsibilityPath categories to a display label, an accent
 * color class, and a Lucide icon.
 */

import type { LucideIcon } from "lucide-react";
import { Heart, Trophy, FileText, Users, Tag, User } from "@/lib/icons";
import type { ResponsibilityPath } from "@/types/responsibility";

export type CategoryKey = ResponsibilityPath["category"];

export interface CategoryMeta {
  label: string;
  /** Tailwind text-color class for the icon and category badge */
  color: string;
  icon: LucideIcon;
}

export const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  medisch: { label: "Medisch", color: "text-red-500", icon: Heart },
  sportief: { label: "Sportief", color: "text-green-600", icon: Trophy },
  administratief: {
    label: "Administratief",
    color: "text-purple-500",
    icon: FileText,
  },
  gedrag: { label: "Gedrag", color: "text-orange-500", icon: Users },
  algemeen: { label: "Algemeen", color: "text-gray-500", icon: User },
  commercieel: { label: "Commercieel", color: "text-blue-500", icon: Tag },
};

/** Display order for the browse view */
export const CATEGORY_ORDER: ReadonlyArray<CategoryKey> = [
  "medisch",
  "sportief",
  "administratief",
  "gedrag",
  "algemeen",
  "commercieel",
];

/**
 * Group a flat list of paths by category, returning a record keyed by
 * `CategoryKey` with the matching paths in their original input order.
 * Categories with no paths get an empty array — callers can filter them
 * out at render time.
 */
export function groupPathsByCategory(
  paths: ReadonlyArray<ResponsibilityPath>,
): Record<CategoryKey, ResponsibilityPath[]> {
  const grouped = {} as Record<CategoryKey, ResponsibilityPath[]>;
  for (const cat of CATEGORY_ORDER) {
    grouped[cat] = [];
  }
  for (const path of paths) {
    grouped[path.category].push(path);
  }
  return grouped;
}
