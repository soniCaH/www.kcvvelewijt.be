/**
 * Player Detail Page — Loading Skeleton
 * Matches the PlayerProfile + share + related articles layout
 */

export default function PlayerDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Player profile header */}
      <div className="relative bg-[#edeff4] overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8 animate-pulse">
            {/* Player photo */}
            <div className="w-[280px] h-[350px] lg:w-[350px] lg:h-[440px] rounded-sm bg-gray-300 flex-shrink-0" />
            {/* Player info */}
            <div className="flex-1 space-y-4 text-center lg:text-left">
              <div className="h-8 w-48 rounded bg-gray-300 mx-auto lg:mx-0" />
              <div className="h-5 w-32 rounded bg-gray-200 mx-auto lg:mx-0" />
              <div className="grid grid-cols-2 gap-4 mt-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="h-5 w-24 rounded bg-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats / season section */}
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 mx-auto" />
              <div className="h-3 w-16 rounded bg-gray-200 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Related articles */}
      <div className="border-t border-gray-200 bg-gray-50">
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
