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
 * Dots appear only after 150 ms of pending (the Chrome speed, no new
 * number); a navigation that finishes sooner unmounts before they ever show.
 * Reduced motion needs nothing extra: the global rule stops the dots' loop,
 * and the 150 ms show is the signal, not motion.
 *
 * Two placements:
 *  - `inline`  — after the label (text links, nav rows, buttons, prose).
 *  - `corner`  — absolutely positioned inside a `relative` whole-card link,
 *                so the card's layout never shifts. Pick the corner that
 *                does not cover the title via `className`.
 */

import { useEffect, useState } from "react";
import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/design-system/Spinner";
import { cn } from "@/lib/utils/cn";

/** The Chrome speed (DESIGN.md → Motion Vocabulary): no new number. */
const PENDING_DELAY_MS = 150;

export type LinkPendingDotsPlacement = "inline" | "corner";
export type LinkPendingDotsTone = "default" | "light";

export interface LinkPendingDotsProps {
  /**
   * `inline` follows the label; `corner` is absolutely positioned (top-right
   * by default) inside a `relative` link.
   * @default 'inline'
   */
  placement?: LinkPendingDotsPlacement;
  /**
   * `light` recolours the dots cream for a dark ground (`bg-jersey-deep`,
   * `bg-jersey-deep-dark`, `bg-ink`) — the default jersey-deep dots all but
   * vanish there. Same `--spinner-dot` override `GalleryLightbox` uses.
   * @default 'default'
   */
  tone?: LinkPendingDotsTone;
  /**
   * Inline only: a `ml-2` gap between the label and the dots. Turn it off
   * when the link is a flex row that already spaces its children (`gap-*`),
   * or the dots sit twice as far away. Ignored for `corner`.
   * @default true
   */
  spaced?: boolean;
  /** Overrides the placement's default position (e.g. `bottom-2 left-2`). */
  className?: string;
}

export function LinkPendingDots({
  placement = "inline",
  tone = "default",
  spaced = true,
  className,
}: LinkPendingDotsProps) {
  const { pending } = useLinkStatus();
  const [elapsed, setElapsed] = useState(false);

  // The delay is a timer, not a CSS fade: a faded-in span still takes its
  // inline size (and a flex parent's `gap`) from the first pending frame, so
  // every tap would re-wrap prose or recentre a button, even on a fast
  // connection. Unmounted until `PENDING_DELAY_MS`, it takes no room at all.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setElapsed(true), PENDING_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [pending]);

  if (!pending || !elapsed) return null;

  return (
    // Decorative for assistive tech: a visual tap acknowledgement only. A
    // live region injected on every tap would rename the focused link
    // ("Nieuws Laden…") and announce even 20 ms navigations; the browser and
    // Next's route announcer already cover navigation for AT.
    <Spinner
      variant="compact"
      aria-hidden="true"
      className={cn(
        placement === "corner"
          ? "pointer-events-none absolute top-2 right-2"
          : spaced && "ml-2",
        tone === "light" && "[--spinner-dot:var(--color-cream)]",
        className,
      )}
    />
  );
}
