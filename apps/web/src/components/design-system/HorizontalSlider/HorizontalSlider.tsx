"use client";

/**
 * HorizontalSlider — generic horizontal scroll container with
 * paper-card prev/next arrows.
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html
 * (slider section + `.arrow-btn` rules — note the canonical layout puts
 * arrows at `left: -8px / right: -8px`, overhanging outside the cards).
 *
 * Arrows render via the shared `<ScrollArrowButton>` so the slider primitive
 * and overflow scrollers (BrandedTabs / FilterTabs) share one canonical
 * 48 × 48 paper button. Two slider-specific layout choices:
 *
 *   - **Overhang**: arrows sit at `left: -20px / right: -20px` (the
 *     mockup spec is `-8px`; bumped per owner feedback to clear the
 *     card outline + offset shadow). Keeps the cream paper button from
 *     sitting directly on top of the cream paper cards — the cream-on-
 *     cream blend made the button visually unclear when overlapping
 *     content. Implemented via explicit `left-[…]/right-[…]` classes
 *     (not negative margin) so `tailwind-merge` resolves the override
 *     unambiguously against the base `left-0/right-0`.
 *   - **Edge fade**: a `mask-image` linear-gradient softens the scroll
 *     track's cut-off where content overflows, so cards fade out instead
 *     of being abruptly clipped. The mask is conditional on
 *     `canScrollLeft / canScrollRight` so it never fades a non-scrollable
 *     edge.
 *
 * On `theme="dark"`, the arrow's shadow swaps to `--shadow-paper-sm-soft`
 * so the offset depth stays readable against an ink panel — same idiom as
 * `.panel--dusk` in the canonical mockup CSS, applied here through a
 * className override.
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { ScrollArrowButton } from "@/components/design-system/ScrollHint/ScrollArrowButton";

export interface HorizontalSliderProps {
  /** Content to scroll horizontally */
  children: ReactNode;
  /** Optional section heading */
  title?: string;
  /** Theme variant — "dark" for ink-bg sections (e.g. homepage MatchesSliderSection) */
  theme?: "light" | "dark";
  /** Additional CSS classes */
  className?: string;
}

const DARK_ARROW_OVERRIDE = "shadow-paper-sm-soft";

// Overhang the arrows outside the relative parent so the cream paper button
// doesn't sit directly on top of the cream paper cards inside the slider.
// Matches the mockup's `left: -8px / right: -8px` rule. We override the
// base `left-0 / right-0` from `ScrollArrowButton` directly (vs negative
// margin) so the position override is unambiguous through `tailwind-merge`.
const LEFT_ARROW_OVERHANG = "left-[-20px]";
const RIGHT_ARROW_OVERHANG = "right-[-20px]";

const FADE_BOTH =
  "[mask-image:linear-gradient(to_right,transparent_0,black_24px,black_calc(100%-24px),transparent_100%)]";
const FADE_RIGHT =
  "[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent_100%)]";
const FADE_LEFT =
  "[mask-image:linear-gradient(to_right,transparent_0,black_24px)]";

function pickFadeMask(canScrollLeft: boolean, canScrollRight: boolean) {
  if (canScrollLeft && canScrollRight) return FADE_BOTH;
  if (canScrollRight) return FADE_RIGHT;
  if (canScrollLeft) return FADE_LEFT;
  return undefined;
}

export const HorizontalSlider = ({
  children,
  title,
  theme,
  className,
}: HorizontalSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    const id = setTimeout(checkScroll, 0);
    return () => clearTimeout(id);
  }, [children, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const themeOverride = theme === "dark" ? DARK_ARROW_OVERRIDE : undefined;
  const fadeMask = pickFadeMask(canScrollLeft, canScrollRight);

  return (
    <div
      className={cn("", className)}
      data-slider-theme={theme === "dark" ? "dark" : "light"}
    >
      {title && (
        <h3
          className={cn(
            "mb-3 text-lg font-bold",
            theme === "dark" ? "text-cream" : "text-ink",
          )}
        >
          {title}
        </h3>
      )}

      <div className="relative">
        {canScrollLeft && (
          <ScrollArrowButton
            direction="left"
            onClick={() => scroll("left")}
            className={cn(LEFT_ARROW_OVERHANG, themeOverride)}
          />
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          data-slot="scroll-track"
          className={cn("overflow-x-auto scroll-smooth pb-2", fadeMask)}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex min-w-max gap-3">{children}</div>
        </div>

        {canScrollRight && (
          <ScrollArrowButton
            direction="right"
            onClick={() => scroll("right")}
            className={cn(RIGHT_ARROW_OVERHANG, themeOverride)}
          />
        )}
      </div>
    </div>
  );
};
