/**
 * VR determinism helper (#3033).
 *
 * Chromium only paints focus state (and therefore the global focus ring that
 * SearchForm's `focus-ring-within` shell draws) when the frame rendering the
 * page is itself focused/active — not merely when `document.activeElement`
 * is set inside it. A script-invoked `element.focus()` does not change that:
 * React already performs that exact call imperatively on mount for
 * `autoFocus` (React never emits the native `autofocus` HTML attribute on a
 * client render — it omits it and calls `domElement.focus()` itself during
 * commit), so an *additional* `.focus()` call in a `play` function is
 * redundant with what `autoFocus` already does, not a fix for it. Whether
 * the ring paints still depends on whether the headless VR worker's page
 * holds real frame focus at screenshot time — an environment property of
 * whichever worker renders a given story, not something a story can force
 * by calling `.focus()` again.
 *
 * The fix instead bypasses the real focus state for the VR render entirely.
 * `SearchForm`'s `<form>` carries a `data-search-form` selector hook, and
 * `globals.css`'s focus-ring rule also matches `[data-vr-force-ring="true"]`
 * — an attribute the component itself never sets. Setting it on that hook
 * paints the ring unconditionally, independent of the runner's real frame
 * focus. Storybook-only — SearchForm's own `autoFocus` prop and
 * `focus-ring-within` shell are untouched, so a real visitor on `/zoeken` is
 * unaffected.
 */
export function forceSearchFocusRing(root: ParentNode): void {
  root
    .querySelector<HTMLFormElement>("[data-search-form]")
    ?.setAttribute("data-vr-force-ring", "true");
}
