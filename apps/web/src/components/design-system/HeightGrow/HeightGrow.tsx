/**
 * A height change is Arrival (#3396, DESIGN.md → Motion): `500ms`, `ease-out`.
 *
 * Content that appears above something already on screen grows from nothing to
 * its natural height, so what sits below slides down instead of jumping. CSS
 * only, no measuring: the wrapper is a one-row grid and the row track
 * transitions `0fr` ↔ `1fr`, which animates to `auto` height without knowing it.
 * `grid-template-rows` (not `interpolate-size` + `height`) because Safari has it.
 * It is a transition, so it runs both ways: `open` flips a wrapper that stays
 * mounted (an accordion), `enter` animates one that mounts closed-to-open.
 *
 * - `enter`: grow on mount, via `starting:` (`@starting-style`). Leave it off and
 *   the content appears at once (the content arrived with its neighbours).
 * - `open={false}`: collapsed to `0fr`. The content stays in the DOM and the
 *   accessibility tree; hiding it from them is the caller's call.
 *
 * Height only: the content is visible from the first frame (no opacity).
 * Under `prefers-reduced-motion` the transition is gone: height is travel, so
 * the change is instant (Reduced-Motion Rule).
 *
 * Collapsed means nothing is painted: the clip has no vertical padding or
 * margin, so at `0fr` it is exactly zero tall and its content (including that
 * content's own padding) is hidden. Only the sides get room, `-mx-3 px-3`, for
 * a paper card's offset shadow and rotated corners. Content that paints above
 * or below its own box brings its own vertical padding, as the `/zoeken` card
 * does (`pt-1 pb-8`: a 0.5° tilt overshoots its top edge by about 3px, the
 * offset shadow its bottom by 6px).
 * Keep the class lists below full literals: Tailwind's scanner has to see them.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface HeightGrowProps {
  /** Expanded (`1fr`) or collapsed (`0fr`). @default true */
  open?: boolean;
  /** Grow from zero when this mounts. @default false */
  enter?: boolean;
  /**
   * Give the clip side room (`-mx-3 px-3`) for a paper card's offset shadow and
   * rotated corners. Turn it off inside a scroll container (`overflow-y-auto`
   * makes `overflow-x` scroll too, so the bleed would add a horizontal
   * scrollbar) with content that paints inside its own box, like a flush row.
   * @default true
   */
  bleed?: boolean;
  /** Classes for the outer wrapper (margins, spacing). */
  className?: string;
  children: ReactNode;
}

export function HeightGrow({
  open = true,
  enter = false,
  bleed = true,
  className,
  children,
}: HeightGrowProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        enter && "starting:grid-rows-[0fr]",
        className,
      )}
    >
      <div className={cn("min-h-0 overflow-hidden", bleed && "-mx-3 px-3")}>
        {children}
      </div>
    </div>
  );
}
