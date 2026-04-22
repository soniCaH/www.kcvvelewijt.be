/**
 * Match Detail Page — Loading Skeleton
 * Matches the MatchDetailView layout: header with teams/score + lineup columns
 */

export default function MatchDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Match header skeleton — dark background */}
      <div className="bg-kcvv-dark-bg px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          {/* Competition + date */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
          </div>

          {/* Teams + score */}
          <div className="flex items-center justify-center gap-6">
            {/* Home team */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />
              <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
            </div>

            {/* Score */}
            <div className="h-12 w-24 animate-pulse rounded bg-white/10" />

            {/* Away team */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />
              <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Lineup skeleton — two columns */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="animate-pulse space-y-3">
              <div className="mb-4 h-5 w-24 rounded bg-gray-200" />
              {Array.from({ length: 11 }).map((_, row) => (
                <div key={row} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded bg-gray-200" />
                  <div className="h-4 w-32 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
