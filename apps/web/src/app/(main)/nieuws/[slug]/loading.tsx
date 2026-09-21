/**
 * Article Detail Page — Loading Skeleton.
 *
 * Mirrors the Phase 5.C composition of `nieuws/[slug]/page.tsx`:
 *   <EditorialHero placement="detail">  ← wide (1040) hero footprint
 *     → <StripedSeam>
 *     → <ArticleMetadata>                ← wide metadata rule (date · leestijd · deel)
 *     → <ArticleBody>                    ← prose (680) reading column
 *     → <RelatedRow>                      ← cream "Blijf nog even hangen." related slider (#2443/#2581)
 *
 * The headline is the article's own CMS title — data — so per #2432 §2 this
 * renders no heading text at all, bars only.
 *
 * Canonical paper-register chrome only — `border-2 border-ink`, square corners,
 * `paper-edge`/`cream` fills. No legacy gray/black overlay hero.
 */

import {
  PageContainer,
  StripedSeam,
  Skeleton,
  LoadingAnnouncement,
  UpLink,
} from "@/components/design-system";

export default function ArticleDetailLoading() {
  return (
    <div className="min-h-screen">
      <LoadingAnnouncement label="Artikel laden…" />

      {/* Up-link — real, unshimmered: its label is fixed copy, not data
          (review round 2, #2570). Mirrors the real page's own container:
          the top air is `<UpLink>`'s own now (#2877), so this container
          supplies none — `<EditorialHeroShell>`'s own flat `pt-12 pb-6`
          below already supplies the gap beneath it (#2876). */}
      <PageContainer width="default">
        <UpLink href="/nieuws" label="Nieuws" />
      </PageContainer>

      {/* EditorialHero footprint — wide (1040): kicker + headline + lead beside
          a framed cover figure. Padding matches `<EditorialHeroShell>`'s own
          flat `pt-12 pb-6` exactly, so nothing shifts when the real hero
          replaces this skeleton (#2876). */}
      <PageContainer as="section" className="pt-12 pb-6" aria-hidden="true">
        <div className="grid grid-cols-1 items-center gap-x-10 gap-y-8 md:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-28" />
            <div className="space-y-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-3/4" />
            </div>
            <Skeleton className="mt-1 h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="border-ink bg-cream-soft shadow-paper-md aspect-[3/2] w-full border-2" />
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Metadata rule — wide (1040): date · reading time · share. */}
      <div
        aria-hidden="true"
        className="border-paper-edge w-full border-y py-3"
      >
        <PageContainer className="flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-20" />
        </PageContainer>
      </div>

      {/* Prose body — narrow reading column (680). Matches `<ArticleBody>`'s
          own `py-12 sm:py-16` (#2571). */}
      <PageContainer
        as="section"
        width="prose"
        className="bg-cream py-12 sm:py-16"
        aria-hidden="true"
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <div className="border-ink bg-cream-soft shadow-paper-sm my-8 aspect-[16/9] w-full border-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </PageContainer>

      {/* "Blijf nog even hangen." related slider — cream band, wide (1040) (#2443/#2581). */}
      <section
        aria-hidden="true"
        className="bg-cream w-full px-4 py-16 lg:py-24"
      >
        <PageContainer className="px-0">
          <Skeleton className="mb-8 h-9 w-56" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-ink bg-cream-soft shadow-paper-sm w-64 flex-none border-2"
              >
                <div className="border-ink aspect-[3/2] border-b-2">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="space-y-2 p-3.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
