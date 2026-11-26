/**
 * Scheurkalender Page — Loading Skeleton
 * Mirrors the poster sheet: masthead bar + two calendar-year columns, each a
 * month heading followed by fixture rows opening on the date tab. The poster
 * panel is real `bg-white` chrome (mimics printed paper), matching the real
 * page's own `bg-white` sheet, not the site's cream field.
 */

import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";

/** One column: a month heading, then rows of date-tab + match. */
const ColumnSkeleton = ({ rows }: { rows: number }) => {
  return (
    <>
      <Skeleton className="mt-5 mb-[7px] h-7 w-40 first:mt-0.5" />
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-3 py-[5px]">
          <Skeleton className="h-2.5 w-[17px]" />
          <Skeleton className="h-3.5 w-5" />
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </>
  );
};

const ScheurkalenderLoading = () => {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Scheurkalender laden…" />

      <PageContainer className="pt-12 pb-12">
        <div className="border-ink border-2 bg-white">
          {/* Masthead */}
          <div className="border-ink flex items-baseline justify-between gap-4 border-b-2 px-4 py-3.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-32" />
          </div>
          {/* Two calendar-year columns */}
          <div className="grid grid-cols-2 px-5 pt-1.5 pb-[18px]">
            <div className="border-ink/15 border-r pr-[17px]">
              <ColumnSkeleton rows={7} />
            </div>
            <div className="pl-[17px]">
              <ColumnSkeleton rows={5} />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default ScheurkalenderLoading;
