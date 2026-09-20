"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useHashLandingCorrection } from "./useHashLandingCorrection";

/** Fallback for `--sticky-header-h` under vitest/happy-dom, where no
 *  stylesheet is loaded. The token itself (`globals.css`) is the real
 *  source of truth — `<SiteHeader>` derives its own height from it. */
const FALLBACK_HEADER_HEIGHT_PX = 65;

/** Reads `--sticky-header-h` off the DOM so a consumer with its own offset
 *  need shares one source instead of hand-copying a number. */
export function getStickyHeaderHeight(): number {
  if (typeof window === "undefined") return FALLBACK_HEADER_HEIGHT_PX;
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--sticky-header-h")
    .trim();
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : FALLBACK_HEADER_HEIGHT_PX;
}

/** The whole pinned strip — header **plus** any sticky section bar below it.
 *
 *  `useSectionNav` already publishes that sum to `documentElement`'s
 *  `scroll-padding-top` (`calc(var(--sticky-header-h) + <bar>px)`) and keeps it
 *  measured through resizes, so reading it back is how a consumer outside the
 *  bar learns the bar's height without the page plumbing it down. Falls back to
 *  the header alone on a page with no section nav — and under happy-dom, where
 *  `scroll-padding-top` resolves to `auto`. */
export function getStickyTopInset(): number {
  if (typeof window === "undefined") return FALLBACK_HEADER_HEIGHT_PX;
  const parsed = parseFloat(
    window.getComputedStyle(document.documentElement).scrollPaddingTop,
  );
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : getStickyHeaderHeight();
}

export interface UseSectionNavResult {
  /** Attach to the sticky bar's own outer element (its `<nav>`). Call this
   *  hook only from a component that renders the bar unconditionally
   *  whenever it is mounted at all — a caller that sometimes returns
   *  `null` (e.g. a nav that hides at ≤1 section) should hoist that branch
   *  *above* the hook, not render it after calling the hook, so the hook's
   *  own lifetime always matches the bar's. */
  navRef: RefObject<HTMLElement | null>;
  /** The bar's own current rendered height in px, 0 before first
   *  measurement. */
  barHeight: number;
  /** `getStickyHeaderHeight() + barHeight` — the header-plus-bar offset a
   *  consumer with its own unrelated need (e.g. a hero-reveal observer)
   *  wants too, computed once here instead of independently at each call
   *  site. */
  topInset: number;
  /** The section currently being read, scroll-spy driven — the fill always
   *  means "the section I am reading now", never "the one I last jumped
   *  to" (#2478 rule 3). `null` before the first observer callback fires,
   *  or when `ids` is empty. */
  activeId: string | null;
}

/**
 * The one shared hook behind every sticky in-page section nav (#2478
 * rules 3 and 7): scroll-spy active state, plus `scroll-padding-top`
 * derived from the header token plus the bar's own measured height — never
 * a hand-written `scroll-mt-*` per section.
 *
 * The scroll-spy's `IntersectionObserver` rebuilds whenever the bar
 * resizes (`topInset` in its dependency array), so it never reports a
 * section "active" while its top is still covered by a since-grown bar.
 * `useHashLandingCorrection` is notified of the same resize, in case a
 * hash navigation is still "armed" against the bar's old, shorter height.
 */
export function useSectionNav(ids: readonly string[]): UseSectionNavResult {
  const navRef = useRef<HTMLElement | null>(null);
  const [barHeight, setBarHeight] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const idsKey = ids.join("|");

  const { notifyLayoutChange } = useHashLandingCorrection(ids);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const measure = () => setBarHeight(el.getBoundingClientRect().height);
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    document.documentElement.style.scrollPaddingTop = `calc(var(--sticky-header-h) + ${barHeight}px)`;
    // Runs after the write above, on purpose: a hash navigation "armed"
    // while the bar was shorter needs the freshly-published offset to
    // correct against.
    notifyLayoutChange();
    return () => {
      document.documentElement.style.scrollPaddingTop = "";
    };
  }, [barHeight, notifyLayoutChange]);

  const topInset = useMemo(
    () => getStickyHeaderHeight() + barHeight,
    [barHeight],
  );

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets = idsKey
      .split("|")
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // A `IntersectionObserverCallback`'s `entries` is a DELTA, not a
    // snapshot — it carries only the targets whose intersection state
    // crossed a threshold since the *previous* delivery, not every
    // observed target's current state. During a single scroll (especially
    // a native smooth-scroll animation, which delivers several batches in
    // quick succession as different targets cross thresholds at different
    // moments), a later batch can carry only an *earlier* section — one
    // that is already mostly scrolled past, its last sliver of overlap
    // finally crossing a threshold — while the section actually being read
    // isn't mentioned at all because its own ratio didn't cross a new
    // threshold in that exact frame. Picking "topmost" from only that
    // batch's entries (the previous approach) then overwrites a correct,
    // still-current pick with a stale one — and if the very next batch
    // reports that same earlier section finally exiting (no longer
    // intersecting), an entries-only reducer has nothing left to fall
    // back to and simply stops updating, leaving the wrong section active.
    //
    // Fixed by keeping every target's own last-known MEMBERSHIP (not its
    // geometry — see below) in a map, updated incrementally by each
    // delivery, and recomputing "topmost currently intersecting" from that
    // complete map every time — so a batch that only mentions one target
    // can never lose track of what every other target most recently
    // reported.
    const state = new Map<string, { intersecting: boolean; el: Element }>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          state.set(entry.target.id, {
            intersecting: entry.isIntersecting,
            el: entry.target,
          });
        }
        let topId: string | null = null;
        let topValue = Infinity;
        for (const [id, s] of state) {
          if (!s.intersecting) continue;
          // Read LIVE, not `entry.boundingClientRect` at delivery time.
          // With `threshold: [0]` a section shorter than the band gets
          // exactly one delivery for its whole visit — the instant it
          // crosses the band's bottom edge — so a snapshotted `top` goes
          // stale for the rest of that visit. Two short sections in the
          // band at once would then tie (or mis-order) on their frozen
          // entry-time values instead of their current position. Reading
          // the element's own rect here instead makes "topmost" correct
          // at decision time regardless of how long ago either delivery
          // fired.
          const top = s.el.getBoundingClientRect().top;
          if (top < topValue) {
            topId = id;
            topValue = top;
          }
        }
        if (topId !== null) setActiveId(topId);
      },
      // Top inset clears the header + this bar; the bottom inset flips
      // "active" near the top third of the viewport, not the very bottom.
      //
      // threshold is `[0]` — membership only, no ratio steps. This is NOT
      // a fix for #2988's `activeId` staying `null`: `isIntersecting` is
      // computed from geometry, independent of the threshold list, so a
      // section that never delivered under `[0, 0.25, 0.6]` would not have
      // delivered under `[0]` either — `[0]` is a strict subset, it can
      // only remove deliveries, never add one. (#2988's actual cause is
      // upstream of this observer entirely: hydration itself, under CPU
      // throttling, sometimes hasn't run by the time a test's assertion
      // window closes — see the PR for the instrumented evidence.) `[0]`
      // is kept because, now that "topmost" is read live above rather than
      // from a stale delivery-time snapshot, the reducer no longer needs
      // ratio steps to keep that snapshot fresh — membership is all it
      // consumes.
      { rootMargin: `-${topInset}px 0px -55% 0px`, threshold: [0] },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [idsKey, topInset]);

  return { navRef, barHeight, topInset, activeId };
}
