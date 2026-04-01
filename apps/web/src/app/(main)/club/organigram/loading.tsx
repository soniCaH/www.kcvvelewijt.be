/**
 * Organigram Page — Loading Skeleton
 * Matches the hero + tabbed organigram layout
 */

export default function OrganigramLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-linear-to-br from-green-main via-green-hover to-green-dark-hover text-white py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-56 rounded bg-white/10" />
          <div className="h-5 w-80 max-w-full rounded bg-white/15" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex gap-4 py-3">
          {["w-28", "w-20", "w-32"].map((w, i) => (
            <div
              key={i}
              className={`h-8 ${w} rounded bg-gray-200 animate-pulse`}
            />
          ))}
        </div>
      </div>

      {/* Card grid (default view) */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8 animate-pulse">
          {Array.from({ length: 3 }).map((_, section) => (
            <div key={section} className="space-y-4">
              <div className="h-6 w-36 rounded bg-gray-200" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm bg-white border border-gray-200 shadow-sm p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200" />
                      <div className="space-y-1 flex-1">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                        <div className="h-3 w-20 rounded bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
