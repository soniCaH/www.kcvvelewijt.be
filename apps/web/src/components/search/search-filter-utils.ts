import type { SearchResult, SearchResultType } from "@/types/search";

export function filterByActiveType(
  results: SearchResult[],
  activeType: SearchResultType | "all",
): SearchResult[] {
  return activeType === "all"
    ? results
    : results.filter((r) => r.type === activeType);
}
