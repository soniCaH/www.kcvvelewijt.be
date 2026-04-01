/**
 * Teams Landing Page — Loading Skeleton
 * Matches the SectionStack layout: hero + featured card + youth directory + CTA
 */

export default function TeamsLoading() {
  return (
    <div className="min-h-screen">
      {/* Section 1: A-team hero (dark) */}
      <div className="relative h-[70vh] min-h-[500px] bg-kcvv-black animate-pulse">
        <div className="absolute inset-0 bg-gray-800" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-12 w-72 rounded bg-white/10" />
            <div className="h-5 w-48 rounded bg-white/15" />
            <div className="h-10 w-40 rounded bg-white/10 mt-4" />
          </div>
        </div>
      </div>

      {/* Section 2: B-team featured card (light) */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-pulse">
            <div className="aspect-[4/3] rounded-sm bg-gray-200" />
            <div className="space-y-4">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-8 w-48 rounded bg-gray-200" />
              <div className="h-5 w-64 rounded bg-gray-200" />
              <div className="h-10 w-36 rounded bg-gray-200 mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Youth teams directory (dark) */}
      <div className="bg-kcvv-black py-20">
        <div className="max-w-5xl mx-auto px-4 space-y-8 animate-pulse">
          <div className="h-8 w-48 rounded bg-white/10" />
          {/* 3 division groups */}
          {Array.from({ length: 3 }).map((_, div) => (
            <div key={div} className="space-y-4">
              <div className="h-6 w-32 rounded bg-white/10" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-sm bg-white/10" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: CTA (light) */}
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
