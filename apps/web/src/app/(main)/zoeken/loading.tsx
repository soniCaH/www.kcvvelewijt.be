/**
 * Search Page — Loading Skeleton
 *
 * Mirrors the 8s1 shell: the real `<SearchMasthead>` band (heading + inert
 * field) over a cream results-area skeleton. No legacy gray/green tokens.
 */

import { SearchMastheadSkeleton } from "@/components/search/SearchMastheadSkeleton";

export default function SearchLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <span role="status" aria-live="polite" className="sr-only">
        Zoekpagina laden...
      </span>

      <SearchMastheadSkeleton />

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Filter chips */}
        <div className="flex animate-pulse gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border-ink/15 bg-ink/5 h-9 w-20 rounded-none border-2"
            />
          ))}
        </div>

        {/* Result rows */}
        <div className="mt-8 animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-ink/15 flex gap-4 rounded-none border-2 bg-white p-4 shadow-[2px_2px_0_0_var(--color-ink)]"
            >
              <div className="bg-ink/10 h-16 w-16 flex-none" />
              <div className="flex-1 space-y-2">
                <div className="bg-ink/10 h-3 w-24" />
                <div className="bg-ink/10 h-4 w-3/4" />
                <div className="bg-ink/10 h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
