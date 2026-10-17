"use client";

import { useEffect } from "react";

/**
 * Hands every browser-made hash entry back to Next's App Router (#3501).
 *
 * A plain `<a href="#x">` (or `location.hash = "x"`) makes the browser push a
 * history entry with `history.state === null`. That entry lacks Next's `__NA`
 * marker, so the router's `popstate` handler ignores it: section chip →
 * player → Back changed the URL to `/ploegen/x#spelers` but left the player
 * page on screen.
 *
 * One listener covers every plain hash link on the site (section chips, the
 * skip link, `revealHash()`, CTAs) without touching them. Mounted once in
 * `app/layout.tsx`. On `hashchange`, an entry without `__NA`:
 *
 * - on the page that's showing (the click case) is re-written through
 *   `replaceState`. Next patches `replaceState`: an outside call makes the
 *   router restore the current tree for this URL, and its `HistoryUpdater`
 *   then stamps `__NA` onto the entry — so a later Back restores this page.
 * - on another page (Back onto an entry made before hydration, or before this
 *   fix shipped) reloads. Re-writing it would pair the shown page's tree with
 *   the other page's URL for good.
 */
export function HashHistorySync() {
  useEffect(() => {
    const onHashChange = (event: HashChangeEvent) => {
      const state: unknown = window.history.state;
      if (state && typeof state === "object" && "__NA" in state) return;
      // `revealHash()` dispatches a synthetic event with empty URLs: same page.
      const from = new URL(event.oldURL || window.location.href);
      const to = new URL(event.newURL || window.location.href);
      if (from.pathname !== to.pathname || from.search !== to.search) {
        window.location.reload();
        return;
      }
      window.history.replaceState(null, "", window.location.href);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
