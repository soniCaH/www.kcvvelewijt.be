/**
 * Opponent History Page — Loading Skeleton
 * Matches the opponent header + W/D/L summary + match history layout
 */

export default function OpponentLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Opponent header */}
      <div className="bg-kcvv-dark-bg text-white py-8 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4 animate-pulse">
          <div className="h-16 w-16 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/15" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* W/D/L summary */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="text-center rounded-sm bg-white border border-gray-200 shadow-sm p-4 space-y-2"
            >
              <div className="h-8 w-8 rounded bg-gray-200 mx-auto" />
              <div className="h-3 w-16 rounded bg-gray-200 mx-auto" />
            </div>
          ))}
        </div>

        {/* Match list */}
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-sm bg-white border border-gray-200 shadow-sm p-3 border-l-4 border-l-gray-300"
            >
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200 flex-1" />
              <div className="h-5 w-12 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
