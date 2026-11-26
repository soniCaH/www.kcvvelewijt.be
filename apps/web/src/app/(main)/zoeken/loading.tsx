/**
 * Search Page — Loading Skeleton
 *
 * Mirrors the 8s1 shell: the real `<SearchMasthead>` band (heading + inert
 * field) over a cream results-area skeleton. No legacy gray/green tokens.
 */

import { SearchMastheadSkeleton } from "@/components/search/SearchMastheadSkeleton";
import {
  PageContainer,
  FilterTabsSkeleton,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";

const SearchLoading = () => {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Zoekpagina laden…" />

      <SearchMastheadSkeleton />

      <PageContainer width="index" className="py-12">
        {/* Filter chips — the shared <FilterTabsSkeleton> (#2564 review
            items 3 + 4); this used to draw 4 uniform `gap-2` placeholders
            with no `pb-1.5`, for the real 5-tab (Alles · Nieuws · Spelers ·
            Staf · Ploegen) `gap-3` row. */}
        <FilterTabsSkeleton widths={["w-14", "w-16", "w-16", "w-12", "w-16"]} />

        {/* Result rows — matches SearchResult.tsx's own chrome exactly:
            bg-cream-soft (not cream) and gap-3.5 (not gap-4) on the row, and
            the image chip's own border-[1.5px] (not border-2). */}
        <div className="mt-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream-soft shadow-paper-sm flex gap-3.5 border-2 p-4"
            >
              <div className="border-ink bg-cream h-16 w-16 flex-shrink-0 border-[1.5px]">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
};

export default SearchLoading;
