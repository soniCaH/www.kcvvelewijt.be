import { cn } from "@/lib/utils/cn";
import type { FilterTabsSurface } from "./FilterTabs";

/**
 * `<FilterTabsSkeleton>` — the shared filter row's loading footprint.
 *
 * The real row hoisted every filter chip's geometry into one primitive
 * (#2429/#2564); without this, the loading path kept the six places that
 * used to draw it by hand: `/kalender`, `/evenementen`, the homepage's
 * `UpcomingMatches` band, `/nieuws`, both of `/hulp`'s rows, and `/zoeken` —
 * three of which were still modelling the OLD wrapping, per-row-sized chips
 * this branch deleted (#2564 review item 3), because nothing tied the
 * skeleton to the shape it stands in for. A skeleton that disagrees with
 * the thing it stands in for is a layout shift by construction (see
 * `<PageHeroSkeleton>`'s docblock, which named this exact failure mode
 * first).
 *
 * One line, `gap-3`, `h-9` chips — `<FilterTabs>`'s own row shape and chip
 * height, so the swap from skeleton to real content never reflows. Chip
 * widths are fixed placeholders, not per-route data: a placeholder's job is
 * to hold the footprint.
 */

export interface FilterTabsSkeletonProps {
  /** Matches the real row's `surface` — drives the placeholder fill. */
  surface?: FilterTabsSurface;
  /** Placeholder chip count. */
  count?: number;
  /** Relative chip widths (Tailwind `w-*` tokens), cycled if shorter than `count`. */
  widths?: readonly string[];
  className?: string;
}

const FILL_CLASS: Record<FilterTabsSurface, string> = {
  paper: "border-ink/15 bg-ink/5",
  inverse: "border-cream/40 bg-cream/10",
};

const DEFAULT_WIDTHS = ["w-16", "w-24", "w-28", "w-20", "w-24"] as const;

export const FilterTabsSkeleton = ({
  surface = "paper",
  count = 5,
  widths = DEFAULT_WIDTHS,
  className,
}: FilterTabsSkeletonProps) => {
  return (
    <div
      aria-hidden
      className={cn("flex gap-3 pb-1.5 motion-safe:animate-pulse", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-9 rounded-none border-2",
            FILL_CLASS[surface],
            widths[i % widths.length],
          )}
        />
      ))}
    </div>
  );
};
