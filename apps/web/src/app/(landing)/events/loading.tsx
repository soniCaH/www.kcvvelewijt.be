/**
 * Events Page — Loading Skeleton
 * Matches the hero gradient + 3-column event card grid
 */

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Hero — real gradient, skeleton text */}
      <div className="from-green-main via-green-hover to-green-dark-hover bg-linear-to-br px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-12 w-64 animate-pulse rounded bg-white/10" />
          <div className="h-6 w-96 max-w-full animate-pulse rounded bg-white/15" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse flex-col overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
            >
              <div className="h-48 bg-gray-200" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-2/3 rounded bg-gray-200" />
                <div className="h-5 w-full rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
