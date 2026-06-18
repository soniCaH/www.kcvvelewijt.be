/**
 * Calendar Page — Loading Skeleton
 * Matches the PageHero + reskinned CalendarWidget layout (Phase 6.D):
 * by-type chips on top, then a paper/ink panel (toolbar = view toggle · shared
 * period nav · subscribe) over a month grid.
 *
 * Note: Unlike /club and /ploegen, this skeleton does not use the SectionStack
 * factory pattern because the calendar page itself uses a flat layout
 * (PageHero + single content div) rather than SectionStack sections. The hero
 * renders compact (no image) per the Phase 10 loading-skeleton lock.
 */

import { PageHero } from "@/components/layout/PageHero";
import { PageContainer } from "@/components/design-system";

export default function CalendarLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <PageContainer width="index" className="pt-10">
        <PageHero
          kicker="Kalender"
          headline="Wedstrijdkalender"
          lead="Bekijk alle wedstrijden en activiteiten van KCVV Elewijt."
          size="compact"
        />
      </PageContainer>

      <PageContainer width="index" className="py-10">
        {/* Matches CalendarWidget's root <div className="space-y-4"> */}
        <div className="space-y-4">
          {/* Type filter chips — pill placeholders matching KalenderFilterBar
              (Alles · Wedstrijden · Clubevent · Supportersactiviteit ·
              Jeugdwerking · Andere) */}
          <div
            className="flex flex-wrap gap-2"
            data-testid="calendar-skeleton-filter-tabs"
          >
            {["w-16", "w-28", "w-24", "w-44", "w-28", "w-20"].map((w, i) => (
              <div
                key={i}
                className={`${w} border-paper-edge bg-cream-soft h-[32px] animate-pulse rounded-full border-2`}
                data-testid="skeleton-pill"
              />
            ))}
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
                className="border-ink inline-flex animate-pulse overflow-hidden border-2"
                data-testid="calendar-skeleton-view-toggle"
              >
                <div className="bg-cream-soft h-[31px] w-16" />
                <div className="bg-cream-soft hidden h-[31px] w-16 md:block" />
                <div className="bg-cream-soft h-[31px] w-16" />
              </div>

              {/* Shared period nav */}
              <div className="flex animate-pulse items-center gap-2">
                <div className="border-ink bg-cream h-8 w-8 border-2" />
                <div className="bg-cream-soft h-6 w-32" />
                <div className="border-ink bg-cream h-8 w-8 border-2" />
              </div>

              {/* Subscribe button */}
              <div
                className="border-ink bg-cream-soft h-[34px] w-28 animate-pulse border-2"
                data-testid="calendar-skeleton-subscribe"
              />
            </div>

            {/* Month grid skeleton — 7 columns */}
            <div className="animate-pulse p-4">
              <div className="border-paper-edge mb-1 grid grid-cols-7 border-b border-dashed">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex justify-center py-2">
                    <div className="bg-cream-soft h-3 w-6 rounded" />
                  </div>
                ))}
              </div>
              <div className="border-ink grid grid-cols-7 border-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-paper-edge min-h-[108px] border-r border-b border-dashed p-1.5 [&:nth-child(7n)]:border-r-0"
                  >
                    <div className="bg-cream-soft h-3 w-4 rounded" />
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
