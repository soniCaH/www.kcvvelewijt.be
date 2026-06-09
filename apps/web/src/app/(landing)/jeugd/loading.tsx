/**
 * `/jeugd` loading skeleton — mirrors the Phase 7 tracer composition on cream
 * (header → editorial nav grid → youth-directory division grid). Replaces the
 * legacy dark `SectionStack`/`getJeugdSections` envelope.
 */

import { FooterSafeArea } from "@/components/design-system";

export default function JeugdLoading() {
  return (
    <>
      <div className="mx-auto w-full max-w-[70rem] px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-12 flex animate-pulse flex-col gap-3">
          <div className="bg-ink/10 h-3 w-48 rounded" />
          <div className="bg-ink/10 h-12 w-72 max-w-full rounded" />
          <div className="bg-ink/10 h-5 w-96 max-w-full rounded" />
        </div>

        {/* Editorial nav grid */}
        <div className="grid animate-pulse grid-cols-1 gap-5 md:grid-cols-3">
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

      <FooterSafeArea />
    </>
  );
}
