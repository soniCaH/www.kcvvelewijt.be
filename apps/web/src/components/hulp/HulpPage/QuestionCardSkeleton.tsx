/**
 * QuestionCardSkeleton — placeholder shaped like QuestionCard
 *
 * Used both server-side (apps/web/src/app/(main)/hulp/loading.tsx for cold
 * loads) and client-side (HulpPage in-search loading state). Sharing the
 * component guarantees the two skeletons can't visually drift apart.
 *
 * Shape mirrors QuestionCard.tsx exactly: same wrapper border/padding,
 * same h-10 w-10 icon container, same h-5 w-5 chevron slot. Block heights
 * match the real card's text line-heights (h-4 = text-base, h-3 = text-sm).
 */

export function QuestionCardSkeleton() {
  return (
    <div className="flex w-full items-start gap-4 rounded-sm border border-gray-200 bg-white p-4">
      {/* Icon placeholder — matches QuestionCard's h-10 w-10 rounded-sm icon container */}
      <div className="h-10 w-10 flex-shrink-0 rounded-sm bg-gray-200" />
      <div className="min-w-0 flex-1 space-y-2">
        {/* Title bar — h-4 matches text-base (16px) line-height */}
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        {/* Summary bar — h-3 matches text-sm (14px) line-height */}
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
      {/* Chevron placeholder — matches QuestionCard's h-5 w-5 self-center */}
      <div className="h-5 w-5 flex-shrink-0 self-center rounded bg-gray-200" />
    </div>
  );
}

export interface QuestionCardSkeletonGridProps {
  /** Number of skeleton cards to render. Default: 4 (2 rows on desktop). */
  count?: number;
  /** SR-only loading message. Default: "Zoeken naar resultaten..." */
  label?: string;
}

export function QuestionCardSkeletonGrid({
  count = 4,
  label = "Zoeken naar resultaten...",
}: QuestionCardSkeletonGridProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <QuestionCardSkeleton key={i} />
      ))}
    </div>
  );
}
