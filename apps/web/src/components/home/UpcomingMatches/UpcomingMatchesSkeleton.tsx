import {
  FilterTabsSkeleton,
  PageContainer,
  Skeleton,
} from "@/components/design-system";

/**
 * `<UpcomingMatches>`'s loading stand-in, shared by every route that renders
 * the band — the homepage and `/kalender` (#3430) — so the two skeletons
 * cannot drift from each other.
 */
export function UpcomingMatchesSkeleton() {
  return (
    <PageContainer width="index" className="py-12 md:py-16" aria-hidden="true">
      <Skeleton className="mb-6 h-9 w-64" />
      {/* Team-chip filter row, then the stacked agenda rows — the band is a
            list, not a card grid (#2398). Chip widths approximate the real
            "Alles · A-Ploeg · U21 …" facet set. The shared
            <FilterTabsSkeleton> (#2564 review item 4) keeps this from
            drifting the way it did pre-absorption, when it modelled the
            narrower `size="sm"` UpcomingMatchesClient has since dropped. */}
      <div className="mb-5">
        <FilterTabsSkeleton widths={["w-16", "w-24", "w-20", "w-14", "w-16"]} />
      </div>
      {/* <MatchRow> is a two-line grid below `sm` and one line above it, so
            the skeleton has to be too or the swap reflows on mobile — the exact
            viewport the youth-parent path targets. */}
      <div className="flex flex-col gap-3 motion-safe:animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-ink bg-cream shadow-paper-sm h-[86px] border-2 sm:h-[70px]"
          />
        ))}
      </div>
    </PageContainer>
  );
}
