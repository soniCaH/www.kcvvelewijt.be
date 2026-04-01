/**
 * Events Page — Loading Skeleton
 * Matches the hero gradient + 3-column event card grid
 */

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Hero — real gradient, skeleton text */}
      <div className="bg-linear-to-br from-green-main via-green-hover to-green-dark-hover text-white py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-12 w-64 rounded bg-white/10 animate-pulse" />
          <div className="h-6 w-96 max-w-full rounded bg-white/15 animate-pulse" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-sm bg-white border border-gray-200 shadow-sm animate-pulse"
            >
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-5 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
