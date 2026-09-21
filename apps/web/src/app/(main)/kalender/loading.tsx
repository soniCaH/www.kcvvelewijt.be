/**
 * Calendar Page — Loading Skeleton
 * Matches the PageHero + reskinned CalendarWidget layout (Phase 6.D):
 * by-type chips on top, then a paper/ink panel (toolbar = view toggle · shared
 * period nav · subscribe) over a month grid.
 *
 * The hero's kicker/headline/lead and its `/images/youth-trainers.jpg` photo
 * are all fixed copy/bundled assets, not data, so per #2432 §2 this reuses
 * the real `<PageHero>` unshimmered — default size (not compact), with the
 * image, matching the real page's own call exactly.
 */

import { PageHero } from "@/components/layout/PageHero";
import {
  PageContainer,
  FilterTabsSkeleton,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";

export default function CalendarLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Kalender laden…" />

      {/* One merged container now, matching the real page (#2571) — the
          opening and the listing are ONE padded section, not two stacked on
          the same colour. */}
      <PageContainer width="index" className="py-12 sm:py-16">
        <PageHero
          kicker="Kalender"
          headline="Wedstrijdkalender"
          lead="Bekijk alle wedstrijden en activiteiten van KCVV Elewijt."
          image="/images/youth-trainers.jpg"
        />

        {/* Matches CalendarWidget's root <div className="space-y-4"> */}
        <div className="mt-10 space-y-4">
          {/* Type filter chips (Alles · Wedstrijden · Clubevent ·
              Supportersactiviteit · Jeugdwerking · Andere) — the shared
              <FilterTabsSkeleton> (#2564 review item 4), so this can't drift
              from the real row's shape the way the six hand-drawn versions
              of it did. */}
          <div data-testid="calendar-skeleton-filter-tabs">
            <FilterTabsSkeleton
              count={6}
              widths={["w-16", "w-28", "w-24", "w-44", "w-28", "w-20"]}
            />
          </div>

          {/* Paper/ink panel */}
          <div className="border-ink bg-cream border-2">
            {/* Toolbar: view toggle · shared period nav · subscribe */}
            <div
              className="border-ink flex flex-wrap items-center justify-between gap-3 border-b-2 p-3"
              data-testid="calendar-skeleton-toolbar-top"
            >
              {/* 3-way view toggle */}
              <div
                className="border-ink inline-flex overflow-hidden border-2"
                data-testid="calendar-skeleton-view-toggle"
              >
                <Skeleton className="h-[31px] w-16" />
                <Skeleton className="hidden h-[31px] w-16 md:block" />
                <Skeleton className="h-[31px] w-16" />
              </div>

              {/* Shared period nav */}
              <div className="flex items-center gap-2">
                <div className="border-ink bg-cream h-8 w-8 border-2" />
                <Skeleton className="h-6 w-32" />
                <div className="border-ink bg-cream h-8 w-8 border-2" />
              </div>

              {/* Subscribe button */}
              <div data-testid="calendar-skeleton-subscribe">
                <Skeleton className="border-ink h-[34px] w-28 border-2" />
              </div>
            </div>

            {/* Month grid skeleton — 7 columns */}
            <div className="p-4">
              <div className="border-paper-edge mb-1 grid grid-cols-7 border-b border-dashed">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex justify-center py-2">
                    <Skeleton className="h-3 w-6" />
                  </div>
                ))}
              </div>
              <div className="border-ink grid grid-cols-7 border-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-paper-edge min-h-[108px] border-r border-b border-dashed p-1.5 [&:nth-child(7n)]:border-r-0"
                  >
                    <Skeleton className="h-3 w-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
