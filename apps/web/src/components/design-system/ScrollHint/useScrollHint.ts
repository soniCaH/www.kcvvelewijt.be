"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useWebfontSwap } from "@/hooks/useWebfontSwap";

const SCROLL_AMOUNT = 200;
const DEAD_ZONE = 10;

export interface UseScrollHintOptions<T extends HTMLElement = HTMLElement> {
  /**
   * How far a single arrow click scrolls. A fixed pixel amount (default
   * 200, matching the chip/table/nav rows) or a function of the track
   * element for a proportional step — `HorizontalSlider` absorbs this hook
   * with `(el) => el.clientWidth * 0.8`, the step its own former
   * `checkScroll` used (#2444 resolution: "HorizontalSlider stops rolling
   * its own checkScroll and consumes useScrollHint").
   */
  scrollAmount?: number | ((el: T) => number);
  /**
   * Extra dependencies that force a re-check beyond the built-in triggers
   * (mount, scroll, resize, a ResizeObserver on the track and its children,
   * a web-font swap). Needed when content changes size via a mechanism a
   * ResizeObserver cannot see — e.g. the organigram explorer's zoom control,
   * a CSS `transform: scale()` that never changes the transformed element's
   * own border box (review finding #2577, part 6).
   */
  remeasureOn?: React.DependencyList;
  /**
   * Caps `remainingLeft` / `remainingRight` at this many pixels. A consumer
   * that renders a fade whose width is `min(fadeWidth, remaining)` should
   * pass its fade width here instead of clamping at the call site (#2860):
   * once the real remaining distance exceeds the cap, the capped value —
   * and therefore the consumer's render — stops changing, since past that
   * point the rendered fade is already at full width regardless of exactly
   * how much further there is to scroll. Defaults to `Infinity` — uncapped,
   * the raw pixel count.
   */
  maxRemainingPx?: number;
}

export interface UseScrollHintReturn<T extends HTMLElement = HTMLElement> {
  scrollRef: React.RefObject<T | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  /**
   * Whether the track overflows at all at the current width — the signal a
   * row of discrete things (chips, crumbs) uses to decide whether to hold
   * its arrow rail open, independent of which direction is currently spent
   * (#2489 resolution part 1: "a scroller holds 40px on both sides exactly
   * when its track overflows at that width, and nothing when it does not").
   */
  overflows: boolean;
  /**
   * Pixels still scrollable to the left — 0 at the start of the track,
   * capped at `maxRemainingPx` when the caller supplies one (uncapped, the
   * raw pixel count, by default).
   */
  remainingLeft: number;
  /**
   * Pixels still scrollable to the right — 0 at the end of the track,
   * capped at `maxRemainingPx` when the caller supplies one (uncapped, the
   * raw pixel count, by default).
   */
  remainingRight: number;
  scrollLeft: () => void;
  scrollRight: () => void;
}

export function useScrollHint<T extends HTMLElement = HTMLElement>(
  options: UseScrollHintOptions<T> = {},
): UseScrollHintReturn<T> {
  const {
    scrollAmount = SCROLL_AMOUNT,
    remeasureOn = [],
    maxRemainingPx = Infinity,
  } = options;
  const scrollRef = useRef<T | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [remainingLeft, setRemainingLeft] = useState(0);
  const [remainingRight, setRemainingRight] = useState(0);

  // The track's own horizontal padding, cached across scroll events.
  // Scrolling cannot change an element's own padding, so re-reading
  // `getComputedStyle` — a forced style/layout flush — on every scroll tick
  // measures a value scrolling never touches. `measurePadding` below is
  // called by every non-scroll trigger (mount, resize, transitionend, the
  // ResizeObserver, the MutationObserver, the font-swap promise) so the
  // cache is refreshed whenever the padding could genuinely have changed;
  // the scroll path (`applyMeasurement`) only ever reads it back (#2860).
  const paddingRef = useRef(0);
  // Handle of the animation frame scheduled by a pending scroll tick, so
  // `scheduleScrollCheck` can coalesce a burst of `scroll` events into one
  // measurement and the cleanup below can cancel a frame that never got a
  // chance to run before unmount.
  const rafRef = useRef<number | null>(null);

  const measurePadding = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const style = window.getComputedStyle(el);
    paddingRef.current =
      parseFloat(style.paddingLeft || "0") +
      parseFloat(style.paddingRight || "0");
  }, []);

  // The measurement itself. Reads only the track's own scroll offsets and
  // dimensions plus the cached padding — never `getComputedStyle` — so it
  // is safe to run on every scroll tick.
  const applyMeasurement = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const rRight = Math.max(0, scrollWidth - clientWidth - scrollLeft);
    const rLeft = Math.max(0, scrollLeft);

    setCanScrollLeft(rLeft > DEAD_ZONE);
    setCanScrollRight(rRight > DEAD_ZONE);

    // `overflows` decides whether a "row of discrete things" reserves a
    // rail (padding) on this very element — so its scrollWidth must not
    // include whatever padding that same decision already applied, or the
    // rail sustains itself forever once triggered. Padding on the track
    // widens scrollWidth by exactly its own width once content overflows
    // the padded content area, while clientWidth does not move (it is
    // fixed by the track's own layout, not by its padding) — so a track
    // that would fit unpadded at a wider viewport can still read as
    // overflowing purely from padding a PRIOR, narrower measurement added.
    // Reading the padding actually on the element (rather than assuming a
    // fixed rail width) keeps this correct for any consumer, railed or not.
    // `paddingRef` is cached rather than re-read here — see the comment on
    // its declaration above — because scroll ticks cannot change it.
    setOverflows(scrollWidth - paddingRef.current - clientWidth > DEAD_ZONE);

    setRemainingLeft(Math.min(maxRemainingPx, rLeft));
    setRemainingRight(Math.min(maxRemainingPx, rRight));
  }, [maxRemainingPx]);

  // Full re-check for every non-scroll trigger: refresh the cached padding
  // first (it may genuinely have changed), then recompute from it.
  const remeasure = useCallback(() => {
    measurePadding();
    applyMeasurement();
  }, [measurePadding, applyMeasurement]);

  // Re-check once the real webfont swap lands (#2822) — a first paint
  // measures with fallback-font metrics, which can under- or over-report
  // overflow until Freight actually swaps in and reflows the track.
  useWebfontSwap(remeasure);

  // The scroll path. A fast scroll fires many `scroll` events within a
  // single frame; only the last one before paint matters, so coalesce them
  // into at most one `applyMeasurement` call per animation frame instead of
  // running it synchronously on every event.
  const scheduleScrollCheck = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      applyMeasurement();
    });
  }, [applyMeasurement]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    remeasure();

    el.addEventListener("scroll", scheduleScrollCheck);
    window.addEventListener("resize", remeasure);
    // A CSS transition (e.g. the organigram explorer's zoom control, a
    // `transform: scale()` on a descendant) changes the rendered size
    // gradually — `remeasureOn` fires immediately on the dependency change,
    // which can read the transform mid-animation rather than its target
    // value. `transitionend` bubbles up from the transitioned descendant to
    // this track, giving a correct final re-check once the animation
    // actually settles.
    el.addEventListener("transitionend", remeasure);

    // #2448: the track's own border box never changes when its CONTENT gets
    // wider — a horizontally-constrained row's width is set by its parent,
    // so the track's own ResizeObserver entry stays silent for the two
    // things that actually change overflow: a web-font swap (handled by
    // `useWebfontSwap` above, not here) and a change in item count (e.g. a
    // Sanity-driven chip row). Observe every child's box too.
    //
    // Children present at mount are not the whole story either — a crumb
    // trail that grows via `navigate()` after mount, for instance, appends
    // children a one-shot `el.children` snapshot never sees. A
    // MutationObserver on the track's own childList catches that: it
    // re-checks scroll AND starts observing any newly-arrived child's own
    // box, so a trail that starts shallow (no overflow) still gets a
    // correct read once it grows deep.
    const resizeObserver = new ResizeObserver(remeasure);
    resizeObserver.observe(el);

    const observedChildren = new WeakSet<Element>();
    const observeChild = (child: Element) => {
      if (observedChildren.has(child)) return;
      observedChildren.add(child);
      resizeObserver.observe(child);
    };
    for (const child of Array.from(el.children)) observeChild(child);

    const mutationObserver = new MutationObserver(() => {
      for (const child of Array.from(el.children)) observeChild(child);
      remeasure();
    });
    mutationObserver.observe(el, { childList: true });

    return () => {
      el.removeEventListener("scroll", scheduleScrollCheck);
      window.removeEventListener("resize", remeasure);
      el.removeEventListener("transitionend", remeasure);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [remeasure, scheduleScrollCheck]);

  // Extra, caller-declared re-measure triggers — e.g. a zoom control whose
  // CSS transform a ResizeObserver cannot see (part 6).

  useEffect(() => {
    remeasure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, remeasureOn);

  const resolveAmount = useCallback(
    (el: T) =>
      typeof scrollAmount === "function" ? scrollAmount(el) : scrollAmount,
    [scrollAmount],
  );

  const scrollLeftFn = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: el.scrollLeft - resolveAmount(el),
      behavior: "smooth",
    });
  }, [resolveAmount]);

  const scrollRightFn = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: el.scrollLeft + resolveAmount(el),
      behavior: "smooth",
    });
  }, [resolveAmount]);

  return {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    overflows,
    remainingLeft,
    remainingRight,
    scrollLeft: scrollLeftFn,
    scrollRight: scrollRightFn,
  };
}
