/**
 * Team Detail Page — Loading Skeleton
 * Matches the TeamDetail layout: header image + tab navigation + content area
 */

export default function TeamDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Team header skeleton — full-width image placeholder */}
      <div className="relative h-64 md:h-80 bg-gray-300 animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/60 to-transparent">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="h-8 w-48 rounded bg-white/20" />
            <div className="h-4 w-32 rounded bg-white/15" />
          </div>
        </div>
      </div>

      {/* Tab navigation skeleton */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 flex gap-4 py-3">
          {["Info", "Opstelling", "Wedstrijden", "Klassement"].map((tab) => (
            <div
              key={tab}
              className="h-8 w-24 rounded bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Content area skeleton — roster grid */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-white border border-foundation-gray-light shadow-sm overflow-hidden"
            >
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="p-3 space-y-2">
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
