import type { MouseEvent } from "react";

/**
 * Bypasses Next's App Router for in-page-anchor nav links that target the page
 * we're already on (e.g. `/hulp#structuur`, `/ploegen/x#spelers`).
 *
 * When a page is hard-loaded with a hash already in the URL, Next seeds the
 * route's `canonicalUrl` *with* that hash. A subsequent same-page `<Link>` click
 * then computes `route.canonicalUrl + url.hash`, duplicating the fragment
 * (`/hulp#structuur#structuur…`). Intercepting the click and scrolling natively
 * sidesteps that path entirely. Links to a different pathname or query string
 * fall through to normal SPA `<Link>` navigation.
 *
 * Wire it into a `<Link onClick>`: it calls `preventDefault()` only for the
 * same-page case, which cancels Next's navigation (Link skips navigating when
 * the click's default was prevented).
 *
 * ponytail: only same-page anchors are intercepted; everything else is a no-op.
 */
export function handleSamePageAnchorClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
): void {
  if (event.defaultPrevented) return;
  // Modifier / middle clicks: let the browser (new tab, etc.) handle it.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const target = new URL(href, window.location.href);
  if (!target.hash || target.hash === "#") return;

  // Intercept only a genuine in-page scroll: same origin, pathname AND query.
  // A different pathname or query (e.g. `/hulp?tab=teams#spelers` from
  // `?tab=matches`) is a real navigation — leave it to Next's `<Link>`.
  if (
    target.origin !== window.location.origin ||
    target.pathname !== window.location.pathname ||
    target.search !== window.location.search
  ) {
    return;
  }

  const id = decodeURIComponent(target.hash.slice(1));
  const el = document.getElementById(id);
  if (!el) return;

  event.preventDefault();
  // Sync the fragment without a router round trip. Passing the current history
  // state keeps Next's internal `__NA` marker, so its patched push/replaceState
  // treats this as an internal write and doesn't re-process the URL.
  if (window.location.hash !== target.hash) {
    // A duplicated/garbled fragment (`#structuur#structuur`, possibly
    // `%23`-encoded) is repaired in place; an ordinary section change gets its
    // own history entry so Back walks through sections like a native anchor.
    const isRepair =
      window.location.hash.startsWith(`${target.hash}#`) ||
      window.location.hash.startsWith(`${target.hash}%23`);
    if (isRepair) {
      window.history.replaceState(window.history.state, "", target.hash);
    } else {
      window.history.pushState(window.history.state, "", target.hash);
    }
  }
  el.scrollIntoView({ behavior: "smooth" });
  el.focus({ preventScroll: true });
}

/**
 * Points `<HulpFinder>` at the question `#<id>`, which it reveals + opens on
 * `hashchange`.
 *
 * Writing the hash the URL already holds changes nothing, so the browser fires
 * no `hashchange` — and a visitor who collapsed that card and then picked the
 * same question again got no response at all. Dispatch the event ourselves in
 * exactly that case.
 *
 * Decoded before comparing: `window.location.hash` comes back percent-encoded
 * while the id is a raw Sanity slug, so a raw comparison would never match a
 * slug carrying a non-ASCII character.
 *
 * ponytail: the plain hash write still does the work in the common case; this
 * only covers the repeat.
 */
export function revealHash(id: string): void {
  if (decodeURIComponent(window.location.hash).slice(1) === id) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = id;
}
