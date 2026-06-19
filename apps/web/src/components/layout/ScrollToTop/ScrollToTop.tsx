"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Resets the window scroll position to the top on every route (pathname)
 * change, unless the URL targets an in-page anchor (`#hash`).
 *
 * Next's App Router scroll-reset is unreliable across shared layouts — a fresh
 * page can load at the previous scroll offset (e.g. clicking a footer link from
 * the bottom of a long page leaves the new page scrolled down). This guarantees
 * every plain navigation starts at the top. The scroll is `instant` so it never
 * animates past the global `scroll-behavior: smooth`.
 *
 * Mounted before <main> in the root layout, so pages that intentionally manage
 * their own scroll (e.g. <AgendaScrollToNext>) run their effect afterwards and
 * win. Hash navigations are left to the browser / Next so in-page anchors keep
 * working.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
