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
 *   to y=1500 during hydration, and ~600 ms later you are back at y=0. This is
 *   also what made `section-nav.spec.ts`'s "OrganigramSectionNav on /hulp"
 *   flaky — the test scrolled a section into view, the mount reset returned the
 *   page to the top, and the scroll-spy correctly reported that no section was
 *   being read.
 * - **A back/forward traversal.** The browser restores the offset the visitor
 *   left; this effect used to overwrite it one frame later. Measured at full
 *   speed, no throttling: leave `/hulp` at y=1507, visit `/sponsors`, press
 *   Back → y=4.
 *
 * Mounted before <main> in the root layout, so pages that intentionally manage
 * their own scroll (e.g. <AgendaScrollToNext>) run their effect afterwards and
 * win. Hash navigations are left to the browser / Next so in-page anchors keep
 * working.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  /**
   * The pathname this effect last ran for. Comparing against it — rather than
   * flipping a "have I mounted yet" boolean — is what makes the initial-load
   * skip survive React Strict Mode, which double-invokes mount effects in
   * `next dev` (on by default for the App Router). A boolean is already spent
   * by the second invocation, so the reset fired anyway in the one environment
   * a developer checks locally.
   */
  const lastPathname = useRef(pathname);
  /**
   * Pathnames that a `popstate` landed on and that the effect below has not
   * accounted for yet.
   *
   * A set, not one slot: a held or double-tapped Back fires several popstates
   * before React commits, and a single slot would keep only the last one — the
   * intermediate commit would then mismatch and scroll to top, re-creating the
   * bug for a multi-step Back.
   *
   * Pathnames, not a bare "a pop happened" flag: a pop that does NOT change the
   * pathname (going back over a `#hash`) never reaches the effect, so a flag
   * would stay armed and swallow the next real forward navigation.
   *
   * The equality below holds because `usePathname()` and
   * `window.location.pathname` agree in this app — it configures no `basePath`,
   * no locale prefix and no rewriting middleware. Adding any of those means
   * normalising here first.
   */
  const poppedTo = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onPopState = () => {
      poppedTo.current.add(window.location.pathname);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const previous = lastPathname.current;
    lastPathname.current = pathname;
    if (previous === pathname) return;

    // Consume this pathname's own pop record, and drop any older ones — they
    // belong to a traversal this navigation has now moved past, so keeping
    // them could suppress a later forward navigation.
    const wasPopped = poppedTo.current.delete(pathname);
    if (!wasPopped) poppedTo.current.clear();
    if (wasPopped) return;

    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
