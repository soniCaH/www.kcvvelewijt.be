import { cn } from "@/lib/utils/cn";
import { Skeleton } from "./Skeleton";

export interface SkeletonBarsProps {
  /** Outer spacing only (e.g. `mt-16`, `py-10`) — sizing/position utilities,
   *  the same contract as `<Skeleton>`'s own `className`. */
  className?: string;
}

/**
 * `<SkeletonBars>` — the content-field vocabulary #2642 introduced: four
 * neutral `paper-edge` bars of varying width standing in for a section whose
 * shape is not knowable before the fetch (a count, a variable list, a gated
 * block that may not render at all). Bars carry no count in the way a card
 * or a table row does — a reader never checks whether four bars became four
 * items.
 *
 * One recipe, not four hand-rolled copies: `ploegen/[slug]/loading.tsx`,
 * `ploegen/[slug]/wedstrijden/loading.tsx`, `ploegen/loading.tsx` and
 * `jeugd/loading.tsx` all compose this instead of repeating the same four
 * `<Skeleton>` lines, so the bar rhythm changes in one file, not four, and
 * the fifth skeleton to adopt the rule has a primitive to reach for instead
 * of a block to copy-paste.
 */
export function SkeletonBars({ className }: SkeletonBarsProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
