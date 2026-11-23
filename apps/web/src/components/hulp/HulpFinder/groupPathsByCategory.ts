import type { ResponsibilityPath } from "@/types/responsibility";
import { CATEGORY_META, type CategoryKey } from "./categoryMeta";

/**
 * Group a flat list of paths by category, keyed by `CategoryKey` with matching
 * paths in their original input order. Empty categories get an empty array.
 */
export function groupPathsByCategory(
  paths: ReadonlyArray<ResponsibilityPath>,
): Record<CategoryKey, ResponsibilityPath[]> {
  // Seed a bucket for every category in CATEGORY_META (the Record<CategoryKey>
  // source of truth) — not CATEGORY_ORDER, which is presentation order only and
  // could omit a key. Callers order the output via CATEGORY_ORDER.
  const grouped = {} as Record<CategoryKey, ResponsibilityPath[]>;
  for (const cat of Object.keys(CATEGORY_META) as CategoryKey[]) {
    grouped[cat] = [];
  }
  for (const path of paths) {
    // Skip categories not in the known set — guards against CMS data drift
    // (a category added in Sanity before the front-end map) rather than
    // throwing on an undefined bucket.
    grouped[path.category]?.push(path);
  }
  return grouped;
}
