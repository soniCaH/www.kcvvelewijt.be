/**
 * Staff Detail Page — Loading Skeleton
 * Matches the hero + bio + positions + responsibilities + related articles layout
 */

export default function StaffDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <span role="status" aria-live="polite" className="sr-only">
        Stafprofiel laden...
      </span>
      {/* Staff hero — photo + name + contact */}
      <div className="from-kcvv-gray-light bg-gradient-to-br to-white">
        <div className="mx-auto flex max-w-4xl animate-pulse flex-col items-center gap-8 px-4 py-12 sm:flex-row sm:items-start">
          <div className="h-40 w-40 flex-shrink-0 rounded-full bg-gray-300" />
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div className="mx-auto h-8 w-48 rounded bg-gray-300 sm:mx-0" />
            <div className="mx-auto h-5 w-32 rounded bg-gray-200 sm:mx-0" />
            <div className="mt-4 flex justify-center gap-3 sm:justify-start">
              <div className="h-8 w-8 rounded bg-gray-200" />
              <div className="h-8 w-8 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Bio section */}
      <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-8">
        <div className="h-6 w-24 rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-3/4 rounded bg-gray-200" />
      </div>

      {/* Positions */}
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-4">
        <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded bg-gray-200" />
              <div className="h-4 w-48 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Related articles */}
      <div className="mt-8 border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
          <div className="mb-4 h-6 w-40 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
              >
                <div className="aspect-[3/2] bg-gray-200" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
