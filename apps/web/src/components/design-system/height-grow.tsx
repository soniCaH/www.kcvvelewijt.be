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
 * The inner clip pads and un-pads by `0.75rem` (`p-3 -m-3`) so `overflow-hidden`
 * does not cut off a paper card's offset shadow and rotated corners once grown.
 * Keep the class lists below full literals: Tailwind's scanner has to see them.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface HeightGrowProps {
  /** Expanded (`1fr`) or collapsed (`0fr`). @default true */
  open?: boolean;
  /** Grow from zero when this mounts. @default false */
  enter?: boolean;
  /** Classes for the outer wrapper (margins, spacing). */
  className?: string;
  children: ReactNode;
}

export function HeightGrow({
  open = true,
  enter = false,
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
      <div className="-m-3 min-h-0 overflow-hidden p-3">{children}</div>
    </div>
  );
}
