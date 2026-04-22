/**
 * Opponent History Page — Loading Skeleton
 * Matches the opponent header + W/D/L summary + match history layout
 */

export default function OpponentLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Opponent header */}
      <div className="bg-kcvv-dark-bg px-4 py-8 text-white">
        <div className="mx-auto flex max-w-3xl animate-pulse items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/15" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* W/D/L/GF/GA summary */}
        <div className="mb-8 grid animate-pulse grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-sm border border-gray-200 bg-white p-4 text-center shadow-sm"
            >
              <div className="mx-auto h-8 w-8 rounded bg-gray-200" />
              <div className="mx-auto h-3 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Match list */}
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-sm border border-l-4 border-gray-200 border-l-gray-300 bg-white p-3 shadow-sm"
            >
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-32 flex-1 rounded bg-gray-200" />
              <div className="h-5 w-12 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
