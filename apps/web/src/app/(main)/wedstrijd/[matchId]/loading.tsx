/**
 * Match Detail Page — Loading Skeleton
 * Matches the MatchDetailView layout: header with teams/score + lineup columns
 */

export default function MatchDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Match header skeleton — dark background */}
      <div className="bg-kcvv-dark-bg text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Competition + date */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-28 rounded bg-white/10 animate-pulse" />
          </div>

          {/* Teams + score */}
          <div className="flex items-center justify-center gap-6">
            {/* Home team */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="h-16 w-16 rounded-full bg-white/10 animate-pulse" />
              <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
            </div>

            {/* Score */}
            <div className="h-12 w-24 rounded bg-white/10 animate-pulse" />

            {/* Away team */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="h-16 w-16 rounded-full bg-white/10 animate-pulse" />
              <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Lineup skeleton — two columns */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="space-y-3 animate-pulse">
              <div className="h-5 w-24 rounded bg-gray-200 mb-4" />
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
