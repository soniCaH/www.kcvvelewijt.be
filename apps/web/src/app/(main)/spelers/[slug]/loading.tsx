/**
 * Player Detail Page — Loading Skeleton
 * Matches the PlayerProfile + share + related articles layout
 */

export default function PlayerDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Player profile header */}
      <div className="relative overflow-hidden bg-[#edeff4]">
        {/* Background gradient — matches PlayerProfile hero */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(135deg, #edeff4 0%, #e0e3eb 50%, #edeff4 100%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 lg:py-12">
          <div className="flex animate-pulse flex-col items-center gap-8 lg:flex-row lg:items-end">
            {/* Player photo */}
            <div className="h-[350px] w-[280px] flex-shrink-0 rounded-sm bg-gray-300 lg:h-[440px] lg:w-[350px]" />
            {/* Player info */}
            <div className="flex-1 space-y-4 text-center lg:text-left">
              <div className="mx-auto h-8 w-48 rounded bg-gray-300 lg:mx-0" />
              <div className="mx-auto h-5 w-32 rounded bg-gray-200 lg:mx-0" />
              <div className="mt-6 grid grid-cols-2 gap-4">
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
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-8">
        <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-gray-200" />
              <div className="mx-auto h-3 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Related articles */}
      <div className="border-t border-gray-200 bg-gray-50">
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
