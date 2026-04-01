/**
 * Staff Detail Page — Loading Skeleton
 * Matches the hero + bio + positions + responsibilities + related articles layout
 */

export default function StaffDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Staff hero — photo + name + contact */}
      <div className="bg-kcvv-dark-bg text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8 animate-pulse">
            <div className="w-48 h-60 rounded-sm bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-48 rounded bg-white/10" />
              <div className="h-5 w-32 rounded bg-white/15" />
              <div className="flex gap-3 mt-4">
                <div className="h-8 w-8 rounded bg-white/10" />
                <div className="h-8 w-8 rounded bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio section */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-6 w-24 rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-3/4 rounded bg-gray-200" />
      </div>

      {/* Positions */}
      <div className="max-w-3xl mx-auto px-4 py-4 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-200 mb-4" />
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
      <div className="border-t border-gray-200 bg-gray-50 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-6 w-40 rounded bg-gray-200 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm bg-white border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="aspect-[3/2] bg-gray-200" />
                <div className="p-3 space-y-2">
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
