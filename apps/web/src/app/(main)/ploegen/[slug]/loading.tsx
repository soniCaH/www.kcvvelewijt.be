/**
 * Team Detail Page — Loading Skeleton.
 *
 * A skeleton draws only what it can know before the fetch (#2642): its
 * route's fixed opening at full fidelity, then neutral bars. This file used
 * to document a mirror intent — a faithful preview of the Phase 6.C
 * composition, squad grid included. That mirror is impossible, not merely
 * costly: `loading.tsx` accepts no parameters, so one file serves all
 * eighteen teams and cannot branch on the slug, and every count below
 * `<TeamHero>` — which of klassement/wedstrijden/spelers/staf render, and
 * how many rows or squad cards each holds — is computed after the very
 * Sanity + PSD fetch this fallback exists to cover.
 *
 * Kept at full fidelity: the `min-h-screen` root, the `sr-only` status
 * region, the up-link (real, fixed copy), `<TeamHero>`'s bars + taped
 * figure, and `<TeamSectionNav>`'s own strip. The strip renders on the
 * balance of cases, not as a strict invariant: `#info` alone is exactly one
 * item, which trips the real bar's `items.length <= 1` null-guard
 * (`TeamSectionNav.tsx:68`) rather than clearing it — `loading.tsx` cannot
 * know whether this team's klassement, wedstrijden, squad and staff are all
 * absent too. Its chips are data (which sections will render) and are not
 * drawn; an `invisible` chip-shaped spacer reserves the real row's height
 * (review round 2, #2642) so the swap-in doesn't collapse the strip to its
 * padding and shift everything below it ~30px. Uses the real
 * `<TeamSectionNav>`'s own `SECTION_NAV_BAR_CLASSES` (sticky positioning
 * included) so the strip can never drift from the shape it stands in for.
 *
 * Everything below the nav — klassement, wedstrijden, the squad grid (both
 * position groups, the cards, and the `rounded-full` avatar circle all die
 * with it), staf, info — is a `<StripedSeam>` and `<SkeletonBars>`, the
 * content-field vocabulary #2642 introduced. Three alternatives were tried
 * and rejected (#2607): a flat slab (no vocabulary for it on this site —
 * every other surface is bars, borders and seams), an ink-bordered box
 * (names a component this skeleton cannot promise — one framed element
 * instead of a seam, three headings and a grid), and nothing at all
 * (indistinguishable from a route with genuinely no content below the
 * fold).
 */

import {
  PageContainer,
  StripedSeam,
  Skeleton,
  SkeletonBars,
  LoadingAnnouncement,
  UpLink,
  SECTION_NAV_BAR_CLASSES,
  SECTION_NAV_CHIP_BASE_CLASSES,
} from "@/components/design-system";
import { cn } from "@/lib/utils/cn";

export default function TeamDetailLoading() {
  return (
    <div className="min-h-screen">
      <LoadingAnnouncement label="Ploeg laden…" />

      {/* Real, unshimmered — its label is fixed copy, not data (review
          round 2, #2570). Same container width as the section below
          (default = container-wide). The container owns the top air
          (`pt-12 lg:pt-16`, matching the real page and the sibling detail
          routes); the hero section below supplies its own bottom gap via
          `py-8 sm:py-12` (matching `<TeamHero>`'s own), so nothing here adds
          a bottom margin (#2876). */}
      <PageContainer className="pt-12 lg:pt-16">
        <UpLink href="/ploegen" label="Ploegen" />
      </PageContainer>

      {/* TeamHero — wide (1040): words column + taped team figure. */}
      <section
        aria-hidden="true"
        className="mx-auto grid w-full max-w-[var(--container-wide)] grid-cols-1 items-start gap-x-10 gap-y-8 px-4 py-8 sm:grid-cols-[1fr_minmax(300px,420px)] sm:py-12 md:px-8"
      >
        <div className="order-last flex flex-col gap-4 sm:order-first">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="border-ink bg-cream-soft shadow-paper-md order-first aspect-[3/2] w-full border-2 sm:order-last" />
      </section>

      {/* TeamSectionNav — see the file docblock: drawn on the balance of
          cases, height reserved either way. The chip-shaped spacer is
          `invisible` (not drawn — it carries no visible fill or shimmer),
          it only occupies the same box a real chip would (border + padding
          + this font's line height), matching `<SectionNavChip>`'s own
          typography classes so the two can never drift apart. */}
      <div aria-hidden="true" className={SECTION_NAV_BAR_CLASSES}>
        <PageContainer className="flex items-center gap-2 py-2">
          <div
            className={cn(
              SECTION_NAV_CHIP_BASE_CLASSES,
              "invisible font-mono text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase",
            )}
          >
            &nbsp;
          </div>
        </PageContainer>
      </div>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Klassement, wedstrijden, the squad grid, staf, info — which of
          these render, and how many rows or cards each holds, is read from
          the same Sanity + PSD fetch this fallback covers (#2642). Neutral
          bars only; no card, table or section shape that would promise a
          structure the fetch may not deliver. */}
      <PageContainer className="py-10">
        <SkeletonBars />
      </PageContainer>
    </div>
  );
}
