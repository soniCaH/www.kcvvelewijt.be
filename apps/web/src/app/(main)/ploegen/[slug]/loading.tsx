/**
 * Team Detail Page — Loading Skeleton
 * Matches the TeamDetail layout: header image + tab navigation + content area
 */

export default function TeamDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Team header skeleton — full-width image placeholder */}
      <div className="relative h-64 animate-pulse bg-gray-200 md:h-80">
        <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/60 to-transparent p-6">
          <div className="mx-auto max-w-4xl space-y-2">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/15" />
          </div>
        </div>
      </div>

      {/* Tab navigation skeleton */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl gap-4 px-4 py-3">
          {["w-16", "w-24", "w-24", "w-20"].map((w, i) => (
            <div
              key={i}
              className={`h-8 ${w} animate-pulse rounded bg-gray-200`}
            />
          ))}
        </div>
      </div>

      {/* Content area skeleton — roster grid */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
            >
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
