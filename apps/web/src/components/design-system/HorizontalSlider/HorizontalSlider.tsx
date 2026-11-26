"use client";

/**
 * HorizontalSlider — generic horizontal scroll container with
 * paper-card prev/next arrows. The card slider — the sole "paper" register
 * of `<ScrollArrowButton>` (#2444, as amended by #2489).
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html
 * (slider section + `.arrow-btn` rules — note the canonical layout puts
 * arrows at `left: -8px / right: -8px`, overhanging outside the cards).
 *
 *   - **Overhang**: arrows sit at `left: -16px / right: -16px`. The mockup
 *     spec is `-8px`; the shipped value was `-20px` (bumped per owner
 *     feedback to clear the card outline + offset shadow — the cream-on-
 *     cream blend read as unclear when overlapping). #2444's resolution
 *     moved it to `-16px`, landing the arrow's outer edge exactly on
 *     `PageContainer`'s 16px gutter instead of 4px past it — this killed a
 *     measured `pageOverflow: 4px` on every viewport below 1072px.
 *     Implemented via explicit `left-[…]/right-[…]` classes (not negative
 *     margin) so `tailwind-merge` resolves the override unambiguously
 *     against the base `left-0/right-0`.
 *   - **Edge fade**: a `mask-image` linear-gradient softens the scroll
 *     track's cut-off where content overflows, so cards fade out instead
 *     of being abruptly clipped. The mask is conditional on
 *     `canScrollLeft / canScrollRight` so it never fades a non-scrollable
 *     edge.
 *
 * Consumes the shared `useScrollHint` (proportional scroll step —
 * `clientWidth * 0.8`, absorbed from this component's own former
 * `checkScroll`) rather than rolling its own overflow measurement — the two
 * had drifted four ways (no `ResizeObserver`, no dead-zone, an extra
 * `children`-change effect, a different step) before this consolidation
 * (#2444 resolution: "HorizontalSlider stops rolling its own checkScroll
 * and consumes useScrollHint"). This is also what makes #2448's re-measure
 * fix apply here for the first time — the component never imported the hook
 * before.
 *
 * `title` and `theme` were deleted (#2444 resolution): neither is passed by
 * `<RelatedRow>`, the component's only consumer — the row renders its own
 * `<EditorialHeading>`, and all seven post-#2443 routes are cream. Deleting
 * `title` also deletes the internal `<h3 class="mb-3 text-lg font-bold">`,
 * raw Tailwind off the type ramp that never rendered in production.
 */

import { cn } from "@/lib/utils/cn";
import { useScrollHint } from "@/components/design-system/ScrollHint/useScrollHint";
import { ScrollArrowButton } from "@/components/design-system/ScrollHint/ScrollArrowButton";
import type { ReactNode } from "react";

export interface HorizontalSliderProps {
  /** Content to scroll horizontally */
  children: ReactNode;
  /** Accessible name for the scroll track — it is a keyboard tab stop
   *  (`tabIndex=0`) in its own right, not just a wrapper around
   *  already-named children (review finding #2577 part 8). Defaults to a
   *  generic English name matching `<FilterTabs>`'s own default
   *  (`"Filter tabs"`) — both are content-agnostic design-system
   *  primitives; a domain consumer overrides with a Dutch label. */
  ariaLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Extra classes merged onto the inner flex track — e.g. a wider
   *  `gap-*` than the default `gap-6 md:gap-8` for a denser card row. */
  trackClassName?: string;
}

// Overhang the arrows outside the relative parent so the cream paper button
// doesn't sit directly on top of the cream paper cards inside the slider.
// -16px lands the arrow's outer edge exactly on PageContainer's 16px
// gutter (#2444 resolution). We override the base `left-0 / right-0` from
// `ScrollArrowButton` directly (vs negative margin) so the position
// override is unambiguous through `tailwind-merge`.
const LEFT_ARROW_OVERHANG = "left-[-16px]";
const RIGHT_ARROW_OVERHANG = "right-[-16px]";

const FADE_BOTH =
  "[mask-image:linear-gradient(to_right,transparent_0,black_24px,black_calc(100%-24px),transparent_100%)]";
const FADE_RIGHT =
  "[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent_100%)]";
const FADE_LEFT =
  "[mask-image:linear-gradient(to_right,transparent_0,black_24px)]";

const pickFadeMask = (canScrollLeft: boolean, canScrollRight: boolean) => {
  if (canScrollLeft && canScrollRight) return FADE_BOTH;
  if (canScrollRight) return FADE_RIGHT;
  if (canScrollLeft) return FADE_LEFT;
  return undefined;
};

export const HorizontalSlider = ({
  children,
  ariaLabel = "Scrollable cards",
  className,
  trackClassName,
}: HorizontalSliderProps) => {
  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } =
    useScrollHint<HTMLDivElement>({
      scrollAmount: (el) => el.clientWidth * 0.8,
    });

  const fadeMask = pickFadeMask(canScrollLeft, canScrollRight);

  return (
    <div className={cn("", className)}>
      <div className="relative">
        {canScrollLeft && (
          <ScrollArrowButton
            direction="left"
            register="paper"
            onClick={scrollLeft}
            className={LEFT_ARROW_OVERHANG}
          />
        )}

        <div
          ref={scrollRef}
          data-slot="scroll-track"
          role="group"
          aria-label={ariaLabel}
          tabIndex={0}
          className={cn("overflow-x-auto scroll-smooth pb-2", fadeMask)}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className={cn("flex min-w-max gap-6 md:gap-8", trackClassName)}>
            {children}
          </div>
        </div>

        {canScrollRight && (
          <ScrollArrowButton
            direction="right"
            register="paper"
            onClick={scrollRight}
            className={RIGHT_ARROW_OVERHANG}
          />
        )}
      </div>
    </div>
  );
};
