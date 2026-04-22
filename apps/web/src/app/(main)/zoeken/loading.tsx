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
      <div className="from-green-main via-green-hover to-green-dark-hover bg-linear-to-br px-4 py-12 text-white">
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div className="h-10 w-40 rounded bg-white/10" />
          <div className="h-12 w-full rounded-lg bg-white/10" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="flex animate-pulse gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Results grid */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
            >
              <div className="aspect-[3/2] bg-gray-200" />
              <div className="space-y-2 p-4">
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
