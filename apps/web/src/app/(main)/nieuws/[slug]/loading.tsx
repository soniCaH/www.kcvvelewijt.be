/**
 * Article Detail Page — Loading Skeleton.
 *
 * Mirrors the Phase 5.C composition of `nieuws/[slug]/page.tsx`:
 *   <EditorialHero placement="detail">  ← wide (1040) hero footprint
 *     → <StripedSeam>
 *     → <ArticleMetadata>                ← wide metadata rule (date · leestijd · deel)
 *     → <ArticleBody>                    ← prose (680) reading column
 *     → <VerderLezenRow>                 ← cream "Verder lezen." related slider
 *
 * Canonical paper-register chrome only — `border-2 border-ink`, square corners,
 * `paper-edge`/`cream` fills, `motion-safe:animate-pulse` bars. No legacy
 * gray/black overlay hero.
 */

import { PageContainer, StripedSeam } from "@/components/design-system";

export default function ArticleDetailLoading() {
  return (
    <div className="min-h-screen">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Artikel laden...
      </span>

      {/* EditorialHero footprint — wide (1040): kicker + headline + lead beside
          a framed cover figure. */}
      <PageContainer
        as="section"
        className="pt-10 pb-6 motion-safe:animate-pulse md:pt-14 md:pb-8"
        aria-hidden="true"
      >
        <div className="grid grid-cols-1 items-center gap-x-10 gap-y-8 md:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="bg-paper-edge h-3 w-28" />
            <div className="space-y-3">
              <div className="bg-paper-edge h-11 w-full" />
              <div className="bg-paper-edge h-11 w-3/4" />
            </div>
            <div className="bg-paper-edge mt-1 h-4 w-5/6" />
            <div className="bg-paper-edge h-4 w-2/3" />
          </div>
          <div className="border-ink bg-cream-soft shadow-paper-md aspect-[3/2] w-full border-2" />
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Metadata rule — wide (1040): date · reading time · share. */}
      <div
        aria-hidden="true"
        className="border-paper-edge w-full border-y py-3 motion-safe:animate-pulse"
      >
        <PageContainer className="flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <div className="bg-paper-edge h-3 w-24" />
            <div className="bg-paper-edge h-3 w-16" />
          </div>
          <div className="bg-paper-edge h-3 w-20" />
        </PageContainer>
      </div>

      {/* Prose body — narrow reading column (680). */}
      <PageContainer
        as="section"
        width="prose"
        className="bg-cream py-10 motion-safe:animate-pulse lg:py-14"
        aria-hidden="true"
      >
        <div className="space-y-3">
          <div className="bg-paper-edge h-4 w-full" />
          <div className="bg-paper-edge h-4 w-full" />
          <div className="bg-paper-edge h-4 w-11/12" />
          <div className="border-ink bg-cream-soft shadow-paper-sm my-8 aspect-[16/9] w-full border-2" />
          <div className="bg-paper-edge h-4 w-full" />
          <div className="bg-paper-edge h-4 w-10/12" />
          <div className="bg-paper-edge h-4 w-full" />
          <div className="bg-paper-edge h-4 w-2/3" />
        </div>
      </PageContainer>

      {/* "Verder lezen." related slider — cream band, wide (1040). */}
      <section
        aria-hidden="true"
        className="bg-cream w-full px-4 py-16 lg:py-24"
      >
        <PageContainer className="px-0 motion-safe:animate-pulse">
          <div className="bg-paper-edge mb-8 h-9 w-56" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-ink bg-cream-soft shadow-paper-sm w-64 flex-none border-2"
              >
                <div className="bg-paper-edge border-ink aspect-[3/2] border-b-2" />
                <div className="space-y-2 p-3.5">
                  <div className="bg-paper-edge h-3 w-20" />
                  <div className="bg-paper-edge h-4 w-full" />
                  <div className="bg-paper-edge h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
