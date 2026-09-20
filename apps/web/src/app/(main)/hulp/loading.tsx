/**
 * `/hulp` hub — route-level loading skeleton.
 *
 * Cream-paper placeholder shaped like the hub (sticky two-door nav · dark hero
 * band · finder), shown for cold navigations before the RSC payload arrives.
 * Mirrors the hub shell (page.tsx) rather than the retired section-stack layout.
 */
import { cn } from "@/lib/utils/cn";
import {
  PageContainer,
  FilterTabsSkeleton,
  Skeleton,
  LoadingAnnouncement,
  SECTION_NAV_CHIP_BASE_CLASSES,
  SECTION_NAV_CHIP_SHADOW_CLASS,
} from "@/components/design-system";

export default function HulpLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Hulppagina laden…" />

      {/* Sticky two-door nav placeholder — the real bar is `bg-cream-deep`
          at `py-2` (#2478 rule 4); `<PageContainer width="index">` and the
          light chip's own classes so this can never drift from the real
          bar's shape.

          Two corrections from #2821, both so the bar does not change height
          on the hand-over from this skeleton to the real nav:

          - **No trailing slot.** The real `<OrganigramSectionNav>` renders
            none at first paint — its `<HubSearch variant="nav">` is gated on
            `heroOutOfView`, which starts `false`. The old `h-9 w-44`
            stand-in was 36px, taller than both the chip beside it and the
            33px slot it stood in for, so it drove this bar to 54px against
            the real bar's 52px.
          - **`h-[19.25px]`, not `h-3`.** The chip's height is set by its
            content box, and the real chip's content is an 11px line at
            `--line-height-loose: 1.75` = 19.25px. A 12px block made this
            chip 26px against the real 33.25px. */}
      <div className="border-ink bg-cream-deep border-b-2" aria-hidden>
        <PageContainer width="index" className="flex items-center gap-3 py-2">
          <div
            className={cn(
              SECTION_NAV_CHIP_BASE_CLASSES,
              SECTION_NAV_CHIP_SHADOW_CLASS,
            )}
          >
            <Skeleton className="h-[19.25px] w-10" />
          </div>
          <div
            className={cn(
              SECTION_NAV_CHIP_BASE_CLASSES,
              SECTION_NAV_CHIP_SHADOW_CLASS,
            )}
          >
            <Skeleton className="h-[19.25px] w-16" />
          </div>
        </PageContainer>
      </div>

      <PageContainer width="index" className="py-10 sm:py-14">
        {/* Hero band — matches OrganigramHero.tsx's 6px offset shadow
            exactly (the `shadow-paper-md` token IS that value). */}
        <div
          aria-hidden
          className="bg-jersey-deep-dark border-ink shadow-paper-md h-56 border-2"
        />

        {/* Finder placeholder — heading · both <FilterTabs> rows (#2429/
            #2564 — audience, then category; the shared <FilterTabsSkeleton>,
            review item 4) · accordion rows. */}
        <div className="mt-12 space-y-3">
          <Skeleton className="h-7 w-56" />
          <FilterTabsSkeleton
            count={5}
            widths={["w-14", "w-16", "w-16", "w-20", "w-20"]}
          />
          <FilterTabsSkeleton
            count={7}
            widths={["w-14", "w-20", "w-24", "w-20", "w-16", "w-20", "w-20"]}
          />
          {/* QuestionCard.tsx's own shadow is a raw 3px arbitrary value, not
              one of the shadow-paper-* tokens (its own offset, not ours to
              round to the nearest token) — matched exactly rather than to
              the nearest 4px token. */}
          <div
            aria-hidden
            className="border-ink bg-cream h-14 border-2 shadow-[3px_3px_0_0_var(--color-ink)]"
          />
          <div
            aria-hidden
            className="border-ink bg-cream h-14 border-2 shadow-[3px_3px_0_0_var(--color-ink)]"
          />
          <div
            aria-hidden
            className="border-ink bg-cream h-14 border-2 shadow-[3px_3px_0_0_var(--color-ink)]"
          />
        </div>
      </PageContainer>
    </div>
  );
}
