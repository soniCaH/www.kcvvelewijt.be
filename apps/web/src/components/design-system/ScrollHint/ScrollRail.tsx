"use client";

import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useScrollHint } from "./useScrollHint";
import { ScrollArrowButton } from "./ScrollArrowButton";
import { MAX_FADE_PX } from "./scrollFadeWidth";

/**
 * Reserved gutter for a "row of discrete things" — chips, crumbs, nav
 * items. Held on both sides exactly when the track overflows at that width
 * (#2489 resolution part 1), never as a permanent breakpoint-gated rail.
 */
const RAIL_PADDING_CLASSES = "pl-10 pr-10";

export interface ScrollRailProps {
  /** Element type for the scrollable track itself — `"ul"` for a nav list
   *  (`TeamSectionNav`), `"nav"` for the organigram breadcrumb, `"div"`
   *  (default) for a chip row (`FilterTabs`). */
  as?: ElementType;
  /** The row's own items. */
  children: ReactNode;
  /** Classes for the track element, in ADDITION to `overflow-x-auto` and
   *  the rail padding — both of which `<ScrollRail>` owns and applies
   *  itself. Do not repeat either here. */
  trackClassName?: string;
  /** Accessible name for the track — every scroll track names itself
   *  (review finding #2577 part 8), since it is a keyboard tab stop
   *  (`tabIndex=0`) in its own right, not just a wrapper around already-
   *  named children. */
  ariaLabel?: string;
  /** ARIA role for the track — `"group"` for `FilterTabs` (a set of
   *  toggles). Omit for an element whose own tag already carries the
   *  right semantics (`<nav>`, `<ul>`) rather than overriding them. */
  role?: string;
  /** Extra classes for both arrow buttons — e.g. the soft-shadow override
   *  a `control`-register arrow needs on a dark host panel (the organigram
   *  breadcrumb), the same override `<HorizontalSlider>`'s paper arrows use
   *  on an ink panel. */
  arrowClassName?: string;
  /** The fade's gradient start colour — must match the track's own
   *  background so the fade reads as a soften rather than a mismatched
   *  patch. Defaults to `"from-cream"`; the organigram breadcrumb (an ink
   *  panel) overrides to `"from-jersey-deep-dark"`. */
  fadeFromClassName?: string;
  /** Classes for the outer `relative` wrapper. */
  className?: string;
}

/**
 * The "rail" idiom — one of the two `<ScrollArrowButton register="control">`
 * consumption patterns (#2444, as amended by #2476/#2478/#2489; the other is
 * `<ScrollOverlay>`). For a row of discrete things — a tap target is
 * unreachable once covered, unlike a table cell or a diagram you merely
 * scroll past — both arrows mount together and hold a 40px gutter on both
 * sides exactly when `useScrollHint`'s `overflows` is true, and the spent
 * direction disables in place rather than unmounting.
 *
 * `register` is deliberately not a prop here: every arrow this component
 * renders is `"control"` — the register is chosen by the content
 * (#2444's rule), and a row of discrete things is never the card slider,
 * so there is nothing for a caller to override. Only `<HorizontalSlider>`
 * (the sole `"paper"` consumer) ever names a register explicitly.
 *
 * Consumers: `<FilterTabs>` (chip row), `<TeamSectionNav>`, the organigram
 * breadcrumb.
 *
 * **Two ways a consumer can still un-fix #3016**, neither of which errors:
 * passing a `min-w-*` of its own in `className` (tailwind-merge lands the
 * caller's last, dropping the `min-w-0` below), or wrapping this component
 * in its own flex-item `<div>` — `min-width: auto` then lives on that
 * wrapper, out of reach. No consumer does either today; if one needs to,
 * carry `min-width: 0` down to whichever box is the flex item.
 */
export function ScrollRail({
  as: Tag = "div",
  children,
  trackClassName,
  ariaLabel,
  role,
  arrowClassName,
  fadeFromClassName = "from-cream",
  className,
}: ScrollRailProps) {
  const {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    overflows,
    remainingLeft,
    remainingRight,
    scrollLeft,
    scrollRight,
  } = useScrollHint<HTMLElement>({ maxRemainingPx: MAX_FADE_PX });

  return (
    // `min-w-0` is load-bearing, not cosmetic (#3016). It holds the track's
    // border box independent of the rail padding applied below — the
    // premise `applyMeasurement` documents and subtracts against, and the
    // one a flex-item wrapper breaks, because `min-width: auto` lets that
    // same padding raise the floor the parent sizes it to. `/hulp`'s
    // audience row was that shape: `clientWidth` 506 ↔ 586 with the rail,
    // arrows mounting and unmounting ~3× a second under a held hover. See
    // the `setOverflows` comment in `useScrollHint` for the arithmetic.
    <div className={cn("relative min-w-0", className)}>
      {overflows && (
        <>
          <div
            aria-hidden="true"
            style={{ width: remainingLeft }}
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-[5] bg-gradient-to-r to-transparent",
              fadeFromClassName,
            )}
          />
          <ScrollArrowButton
            direction="left"
            register="control"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={arrowClassName}
          />
        </>
      )}

      <Tag
        ref={scrollRef}
        role={role}
        aria-label={ariaLabel}
        tabIndex={0}
        className={cn(
          "overflow-x-auto",
          overflows && RAIL_PADDING_CLASSES,
          trackClassName,
        )}
      >
        {children}
      </Tag>

      {overflows && (
        <>
          <div
            aria-hidden="true"
            style={{ width: remainingRight }}
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-[5] bg-gradient-to-l to-transparent",
              fadeFromClassName,
            )}
          />
          <ScrollArrowButton
            direction="right"
            register="control"
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={arrowClassName}
          />
        </>
      )}
    </div>
  );
}
