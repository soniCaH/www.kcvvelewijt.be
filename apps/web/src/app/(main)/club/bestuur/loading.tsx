/**
 * Board Page — Loading Skeleton
 * Matches the BestuurPage layout: team header + member grid + staff list
 */

export default function BoardLoading() {
  return (
    <div className="min-h-screen space-y-12">
      {/* Team header */}
      <div className="relative h-48 md:h-64 bg-gray-200 animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/60 to-transparent">
          <div className="max-w-inner-lg mx-auto space-y-2">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="h-4 w-64 rounded bg-white/15" />
          </div>
        </div>
      </div>

      {/* Member grid */}
      <div className="max-w-inner-lg mx-auto px-4 py-12">
        <div className="h-6 w-24 rounded bg-gray-200 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-white border border-gray-200 shadow-sm overflow-hidden"
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

      {/* Staff list */}
      <div className="max-w-inner-lg mx-auto px-4 py-4 animate-pulse">
        <div className="h-6 w-16 rounded bg-gray-200 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-200" />
              <div className="space-y-1">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
