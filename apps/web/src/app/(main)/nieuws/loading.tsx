/**
 * News Listing Page — Loading Skeleton
 * Matches the featured split (2fr|1fr) + 3-column grid layout
 */

export default function NewsLoading() {
  return (
    <div className="w-full">
      {/* Sticky filter bar skeleton */}
      <div className="sticky top-0 z-30 bg-kcvv-dark-bg/95 backdrop-blur-sm border-b border-white/10 py-3">
        <div className="max-w-inner-lg mx-auto px-3 lg:px-0 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 rounded-full bg-white/10 animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="max-w-inner-lg mx-auto px-3 lg:px-0 py-6">
        {/* Featured split: 2fr | 1fr */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Main featured card — 2fr */}
          <div className="md:col-span-2">
            <div className="relative aspect-[3/2] rounded-sm bg-gray-200 animate-pulse overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
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
                className="flex-1 rounded-sm bg-white border border-foundation-gray-light shadow-sm animate-pulse overflow-hidden"
              >
                <div className="h-32 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-16 rounded bg-gray-200" />
                  <div className="h-5 w-full rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Grid of listing cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-white border border-foundation-gray-light shadow-sm animate-pulse overflow-hidden"
            >
              <div className="aspect-[3/2] bg-gray-200" />
              <div className="p-4 space-y-2">
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
