/**
 * Organigram Page — Loading Skeleton
 * Matches the hero + tabbed organigram layout
 */

export default function OrganigramLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="from-green-main via-green-hover to-green-dark-hover bg-linear-to-br px-4 py-12 text-white">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-10 w-56 rounded bg-white/10" />
          <div className="h-5 w-80 max-w-full rounded bg-white/15" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl gap-4 px-4 py-3">
          {["w-28", "w-20", "w-32"].map((w, i) => (
            <div
              key={i}
              className={`h-8 ${w} animate-pulse rounded bg-gray-200`}
            />
          ))}
        </div>
      </div>

      {/* Card grid (default view) */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-pulse space-y-8">
          {Array.from({ length: 3 }).map((_, section) => (
            <div key={section} className="space-y-4">
              <div className="h-6 w-36 rounded bg-gray-200" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-sm border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-1">
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
