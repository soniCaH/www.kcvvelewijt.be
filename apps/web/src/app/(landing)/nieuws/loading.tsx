/**
 * News Listing Page — Loading Skeleton.
 *
 * Mirrors `NewsListingClient`: a sticky paper category-filter bar over one
 * chronological 1 → 2 → 3 listing grid. Index width (1280). Cards use the
 * canonical paper-register chrome (`border-2 border-ink`, square corners,
 * offset `shadow-paper-sm`, `cream-soft`/`paper-edge` fills).
 *
 * The "Uitgelicht" featured row #2432 wrote this skeleton against is gone —
 * #2569 deleted it from the page, so shimmering it here would announce a shape
 * that never arrives.
 *
 * The opening's kicker + headline ("Nieuwsarchief") is fixed copy, not data —
 * per #2432 §2 this reuses the real `<PageHero>` unshimmered, the `/zoeken`
 * model: the `<h1>` is correct from the first byte and nothing reflows.
 */

import {
  PageContainer,
  TapedCardGrid,
  FilterTabsSkeleton,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { NEWS_KICKER, NEWS_HEADLINE } from "./copy";

/** A flush-image card footprint — image atop a border-2 ink body. The inline
 *  `transform` mirrors `<TapedCard rotation="auto">`'s own non-interactive
 *  style exactly — the `--taped-card-rotation` slot var a `<TapedCardGrid>`
 *  sets, read the same way here as it will be by the real `<NewsCard>` on
 *  arrival, so the card doesn't visibly snap from flat to tilted on swap. */
function NewsCardSkeleton() {
  return (
    <div
      className="border-ink bg-cream-soft shadow-paper-sm overflow-hidden border-2"
      style={{ transform: "rotate(var(--taped-card-rotation, 0deg))" }}
    >
      <div className="border-ink aspect-[3/2] border-b-2">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function NewsLoading() {
  return (
    <div className="w-full">
      <LoadingAnnouncement label="Nieuws laden…" />

      {/* The opening — real, unshimmered (fixed copy). */}
      <PageContainer width="index" className="pt-12 sm:pt-16">
        <PageHero
          register="minimal"
          kicker={NEWS_KICKER}
          headline={NEWS_HEADLINE}
        />
      </PageContainer>

      {/* Sticky filter bar — mirrors the live page's paper category-filter
          band (#2805: the bar moved off a pre-redesign `bg-ink/95` onto
          <TeamSectionNav>'s sticky ground). `top-[var(--sticky-header-h)]`
          (not `top-0`, #2487; not the hand-written `top-16`, #2820 — that
          was 1px short of the header's true 65px height) clears the opaque
          `sticky top-0 z-50` <SiteHeader> exactly — must stay byte-identical
          to the live bar's offset or the skeleton and the loaded page
          disagree about where the bar sticks. The shared <FilterTabsSkeleton>
          (#2564 review items 3 + 4): the real row dropped its `size="sm"`
          (~29px) chip for the one `md` (~36px) size on absorption, and this
          skeleton — still drawing `h-8` (32px) — used to reflow on every
          /nieuws load. `surface` is omitted (default `"paper"`) to keep the
          skeleton and the live row's beliefs about the ground in sync. */}
      <div className="border-ink bg-cream sticky top-[var(--sticky-header-h)] z-30 border-b-2 py-3">
        <PageContainer width="index">
          <FilterTabsSkeleton
            widths={["w-16", "w-20", "w-24", "w-20", "w-16"]}
          />
        </PageContainer>
      </div>

      <PageContainer width="index" className="py-6">
        {/* Chronological listing — the same primitive the page renders, so the
            ladder and gutter cannot drift out of the loading state. */}
        <TapedCardGrid columns={3} gap="md" className="mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </TapedCardGrid>
      </PageContainer>
    </div>
  );
}
