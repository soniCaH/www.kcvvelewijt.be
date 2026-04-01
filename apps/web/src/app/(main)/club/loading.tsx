/**
 * Club Landing Page — Loading Skeleton
 * Matches the SectionStack layout: hero + editorial grid + mission banner + CTA
 */

export default function ClubLoading() {
  return (
    <div className="min-h-screen">
      {/* Section 1: Hero (dark) */}
      <div className="relative h-[60vh] min-h-[400px] bg-kcvv-black animate-pulse">
        <div className="absolute inset-0 bg-gray-800" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-10 w-64 rounded bg-white/10" />
            <div className="h-5 w-80 max-w-full rounded bg-white/15" />
            <div className="h-10 w-36 rounded bg-white/10 mt-4" />
          </div>
        </div>
      </div>

      {/* Section 2: Editorial grid (light) */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-4 animate-pulse">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-7 aspect-[4/3] rounded-sm bg-gray-200" />
            <div className="col-span-12 md:col-span-5 space-y-4">
              <div className="aspect-[4/3] rounded-sm bg-gray-200" />
              <div className="aspect-[4/3] rounded-sm bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Mission banner (dark) */}
      <div className="bg-kcvv-black py-16">
        <div className="max-w-3xl mx-auto px-4 text-center animate-pulse space-y-4">
          <div className="h-6 w-12 rounded bg-white/10 mx-auto" />
          <div className="h-8 w-96 max-w-full rounded bg-white/10 mx-auto" />
          <div className="h-4 w-48 rounded bg-white/15 mx-auto" />
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
