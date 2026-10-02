"use client";

/**
 * LinkPendingDots — acknowledges a tap while its navigation is pending.
 *
 * The fourth waiting job of the Waiting-Device Rule (DESIGN.md → Motion):
 * a tap waiting on a navigation waits as the compact dots on the tapped
 * link (#3386, decided at #2499). Placed by hand as a child of every
 * internal `<Link>` — `useLinkStatus` reads the nearest ancestor `<Link>`,
 * so it must be rendered inside one. No lint rule or test enforces the
 * placement; the convention lives in DESIGN.md.
 *
 * Nothing renders while the navigation is not pending, so a link's resting
 * layout and every Visual Regression baseline are unchanged.
 *
 * The 150 ms delay (the Chrome speed, no new number) lives on the wrapper as
 * `.kcvv-pending-reveal` (globals.css) — never on the dot spans, which
 * already spend `animation-delay` on their stagger. A navigation that
 * finishes sooner unmounts the dots before they ever show.
 *
 * Two placements:
 *  - `inline`  — after the label (text links, nav rows, buttons, prose).
 *  - `corner`  — absolutely positioned inside a `relative` whole-card link,
 *                so the card's layout never shifts. Pick the corner that
 *                does not cover the title via `className`.
 */

import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/design-system/Spinner";
import { cn } from "@/lib/utils/cn";

export type LinkPendingDotsPlacement = "inline" | "corner";

export interface LinkPendingDotsProps {
  /**
   * `inline` follows the label; `corner` is absolutely positioned (top-right
   * by default) inside a `relative` link.
   * @default 'inline'
   */
  placement?: LinkPendingDotsPlacement;
  /** Overrides the placement's default position (e.g. `bottom-2 left-2`). */
  className?: string;
}

export function LinkPendingDots({
  placement = "inline",
  className,
}: LinkPendingDotsProps) {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <Spinner
      variant="compact"
      className={cn(
        "kcvv-pending-reveal",
        placement === "corner"
          ? "pointer-events-none absolute top-2 right-2"
          : "ml-2",
        className,
      )}
    />
  );
}
