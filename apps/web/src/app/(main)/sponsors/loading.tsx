/**
 * Sponsors Page — Loading Skeleton
 * Matches the tiered sponsor grid layout with CTA
 */

export default function SponsorsLoading() {
  return (
    <div className="min-h-screen">
      {/* Header section (dark) */}
      <div className="bg-kcvv-dark-bg text-white py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-48 rounded bg-white/10" />
          <div className="h-5 w-80 max-w-full rounded bg-white/15" />
        </div>
      </div>

      {/* Sponsor tiers */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Gold tier */}
        <div className="animate-pulse">
          <div className="h-6 w-40 rounded bg-gray-200 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/2] rounded-sm bg-gray-200 border border-gray-200"
              />
            ))}
          </div>
        </div>

        {/* Silver tier */}
        <div className="animate-pulse">
          <div className="h-6 w-36 rounded bg-gray-200 mb-6" />
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/2] rounded-sm bg-gray-200 border border-gray-200"
              />
            ))}
          </div>
        </div>

        {/* Bronze tier */}
        <div className="animate-pulse">
          <div className="h-6 w-32 rounded bg-gray-200 mb-6" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/2] rounded-sm bg-gray-200 border border-gray-200"
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200 mx-auto" />
          <div className="h-5 w-96 max-w-full rounded bg-gray-200 mx-auto" />
          <div className="h-10 w-32 rounded bg-gray-200 mx-auto mt-4" />
        </div>
      </div>
    </div>
  );
}
