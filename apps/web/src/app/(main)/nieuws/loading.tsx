/**
 * News Listing Page — Loading Skeleton
 * Matches the featured split (2fr|1fr) + 3-column grid layout
 */

export default function NewsLoading() {
  return (
    <div className="w-full">
      {/* Sticky filter bar skeleton */}
      <div className="bg-kcvv-dark-bg/95 sticky top-0 z-30 border-b border-white/10 py-3 backdrop-blur-sm">
        <div className="max-w-inner-lg mx-auto flex gap-2 px-3 lg:px-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-white/10"
            />
          ))}
        </div>
      </div>

      <div className="max-w-inner-lg mx-auto px-3 py-6 lg:px-0">
        {/* Featured split: 2fr | 1fr */}
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Main featured card — 2fr */}
          <div className="md:col-span-2">
            <div className="relative aspect-[3/2] animate-pulse overflow-hidden rounded-sm bg-gray-200">
              <div className="absolute right-0 bottom-0 left-0 space-y-2 p-4">
                <div className="h-4 w-16 rounded bg-gray-300" />
                <div className="h-6 w-3/4 rounded bg-gray-300" />
                <div className="h-4 w-1/3 rounded bg-gray-300" />
              </div>
            </div>
          </div>
          {/* Right stack — 1fr, 2 stacked cards */}
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
              >
                <div className="h-32 bg-gray-200" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-16 rounded bg-gray-200" />
                  <div className="h-5 w-full rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Grid of listing cards */}
        <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
            >
              <div className="aspect-[3/2] bg-gray-200" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-5 w-full rounded bg-gray-200" />
                <div className="h-5 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
