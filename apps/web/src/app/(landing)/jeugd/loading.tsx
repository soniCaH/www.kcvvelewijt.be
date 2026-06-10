/**
 * `/jeugd` loading skeleton — mirrors the Phase 7 composition on cream
 * (split hero → seam → filosofie/visie block → editorial nav grid →
 * youth-directory division grid). Replaces the legacy dark
 * `SectionStack`/`getJeugdSections` envelope.
 */

export default function JeugdLoading() {
  return (
    <>
      <div className="mx-auto w-full max-w-[70rem] px-4 py-10 sm:py-14">
        {/* Split hero — text column + photo */}
        <div className="grid animate-pulse items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="bg-ink/10 h-3 w-48 rounded" />
            <div className="bg-ink/10 h-14 w-80 max-w-full rounded" />
            <div className="bg-ink/10 h-16 w-full max-w-[28rem] rounded" />
            <div className="bg-ink/10 h-3 w-64 rounded" />
          </div>
          <div className="bg-ink/10 aspect-[3/2] w-full rounded-sm" />
        </div>

        {/* Seam */}
        <div className="bg-ink/10 my-10 h-[18px] w-full animate-pulse rounded sm:my-12" />

        {/* Filosofie / visie block */}
        <div className="animate-pulse">
          <div className="bg-ink/10 mb-4 h-3 w-40 rounded" />
          <div className="bg-ink/10 h-32 w-full rounded-sm" />
        </div>

        {/* Editorial nav grid */}
        <div className="mt-16 grid animate-pulse grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-ink/10 aspect-[16/9] rounded-sm" />
          ))}
        </div>

        {/* Youth directory */}
        <div className="mt-16 animate-pulse space-y-8">
          <div className="bg-ink/10 h-8 w-44 rounded" />
          {Array.from({ length: 3 }).map((_, div) => (
            <div key={div} className="space-y-4">
              <div className="bg-ink/10 h-4 w-32 rounded" />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-ink/10 h-20 rounded-sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA band (full-bleed) */}
      <div className="bg-jersey-deep-dark border-ink animate-pulse border-y-2">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-12 sm:py-16">
          <div className="bg-cream/15 h-8 w-72 max-w-full rounded" />
          <div className="bg-cream/15 h-4 w-96 max-w-full rounded" />
          <div className="bg-cream/15 h-11 w-40 rounded" />
        </div>
      </div>
    </>
  );
}
