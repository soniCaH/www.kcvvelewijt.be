/**
 * News Listing Page — Loading Skeleton.
 *
 * Mirrors `NewsListingClient`: a sticky dark category-filter bar over a uniform
 * 3-up "Uitgelicht" featured grid (the old 2fr|1fr split was retired in #2027)
 * and a 3-column chronological listing grid. Index width (1280). Cards use the
 * canonical paper-register chrome (`border-2 border-ink`, square corners,
 * offset `shadow-paper-sm`, `cream-soft`/`paper-edge` fills).
 */

import { PageContainer } from "@/components/design-system";

/** A flush-image card footprint — image atop a border-2 ink body. */
function NewsCardSkeleton() {
  return (
    <div className="border-ink bg-cream-soft shadow-paper-sm overflow-hidden border-2">
      <div className="bg-paper-edge border-ink aspect-[3/2] border-b-2" />
      <div className="space-y-2 p-4">
        <div className="bg-paper-edge h-3 w-16" />
        <div className="bg-paper-edge h-5 w-full" />
        <div className="bg-paper-edge h-5 w-2/3" />
        <div className="bg-paper-edge h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function NewsLoading() {
  return (
    <div className="w-full">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Nieuws laden...
      </span>

      {/* Sticky filter bar — mirrors the page's dark category-filter band. */}
      <div className="bg-ink/95 sticky top-0 z-30 border-b border-white/10 py-3 backdrop-blur-sm">
        <PageContainer width="index" className="flex animate-pulse gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-cream/15 h-8 w-20" />
          ))}
        </PageContainer>
      </div>

      <PageContainer width="index" className="py-6">
        {/* Uitgelicht — uniform 3-up featured grid. */}
        <section className="mb-10">
          <div className="bg-paper-edge mb-6 h-9 w-48 animate-pulse" />
          <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Chronological listing — 3-column grid. */}
        <section className="mb-6 grid animate-pulse grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </section>
      </PageContainer>
    </div>
  );
}
