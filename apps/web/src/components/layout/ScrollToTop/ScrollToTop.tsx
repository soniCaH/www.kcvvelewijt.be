"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Resets the window scroll position to the top when the visitor navigates
 * **forward** to a new route, unless the URL targets an in-page anchor
 * (`#hash`).
 *
 * Next's App Router scroll-reset is unreliable across shared layouts — a fresh
 * page can load at the previous scroll offset (e.g. clicking a footer link from
 * the bottom of a long page leaves the new page scrolled down). This guarantees
 * every plain forward navigation starts at the top. The scroll is `instant` so
 * it never animates past the global `scroll-behavior: smooth`.
 *
 * **Two navigations it must keep its hands off (#2986).** A `useEffect` keyed
 * on `[pathname]` also runs for both, and scrolling there overwrites a position
 * the browser had already placed correctly:
 *
 * - **The initial load.** The effect runs on mount, several hundred ms after
 *   first paint on a slow device — long enough for a visitor to have started
 *   reading. Measured on the live deployment under 20× CPU throttling: scroll
 *   to y=1500 during hydration, and ~600 ms later you are back at y=0.
 * - **A back/forward traversal.** The browser (and Next) restore the offset
 *   the visitor left; this effect used to overwrite it one frame later.
 *   Measured at full speed, no throttling: leave `/hulp` at y=1507, visit
 *   `/sponsors`, press Back → y=4.
 *
 * The second one is also what made `section-nav.spec.ts:140` flaky — the test
 * scrolled a section into view, the mount reset returned the page to the top,
 * and the scroll-spy correctly reported that no section was being read.
 *
 * Mounted before <main> in the root layout, so pages that intentionally manage
 * their own scroll (e.g. <AgendaScrollToNext>) run their effect afterwards and
 * win. Hash navigations are left to the browser / Next so in-page anchors keep
 * working.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  /** Unset after the mount run — the browser placed the first page itself. */
  const isInitialRender = useRef(true);
  /**
   * The pathname a `popstate` just landed on, or `null`. Recording the path
   * rather than a bare "a pop happened" flag is what keeps this from leaking:
   * a pop that does NOT change the pathname (going back over a `#hash`) never
   * reaches the effect below, so a bare flag would stay armed and swallow the
   * next real forward navigation.
   */
  const poppedTo = useRef<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      poppedTo.current = window.location.pathname;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Consumed on every pathname change, whichever branch wins below: a stale
    // entry can only survive until the next navigation, never past it.
    const landedOnByPop = poppedTo.current;
    poppedTo.current = null;

    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    if (landedOnByPop === pathname) return;
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
