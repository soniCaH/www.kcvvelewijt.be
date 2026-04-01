/**
 * Search Page — Loading Skeleton
 * Matches the hero with search input + results grid layout
 */

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <span role="status" aria-live="polite" className="sr-only">
        Zoekpagina laden...
      </span>
      {/* Hero with search bar */}
      <div className="bg-linear-to-br from-green-main via-green-hover to-green-dark-hover text-white py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-40 rounded bg-white/10" />
          <div className="h-12 w-full rounded-lg bg-white/10" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex gap-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Results grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-white border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="aspect-[3/2] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-5 w-full rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
