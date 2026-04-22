/**
 * Board Page — Loading Skeleton
 * Matches the BestuurPage layout: team header + member grid + staff list
 */

export default function BoardLoading() {
  return (
    <div className="min-h-screen space-y-12">
      {/* Team header */}
      <div className="relative h-48 animate-pulse bg-gray-200 md:h-64">
        <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/60 to-transparent p-6">
          <div className="max-w-inner-lg mx-auto space-y-2">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="h-4 w-64 rounded bg-white/15" />
          </div>
        </div>
      </div>

      {/* Member grid */}
      <div className="max-w-inner-lg mx-auto px-4 py-12">
        <div className="mb-6 h-6 w-24 animate-pulse rounded bg-gray-200" />
        <div className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

      {/* Staff list */}
      <div className="max-w-inner-lg mx-auto animate-pulse px-4 py-4">
        <div className="mb-4 h-6 w-16 rounded bg-gray-200" />
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

        {/* Organigram CTA placeholder */}
        <section
          aria-hidden="true"
          className="mt-8 flex flex-col items-start justify-between gap-6 rounded-xl bg-gray-200 p-8 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded bg-gray-300" />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded bg-gray-300" />
              <div className="h-4 w-64 max-w-full rounded bg-gray-300" />
            </div>
          </div>
          <div className="h-10 w-36 shrink-0 rounded-lg bg-gray-300" />
        </section>
      </div>
    </div>
  );
}
