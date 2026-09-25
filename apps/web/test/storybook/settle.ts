/**
 * Waits for a story's fixture to settle before asserting an ABSENCE (#3146,
 * review finding 8) — a one-shot synchronous query right after mount can
 * read a fixture before a LATE remeasure has run, passing "no arrow
 * mounted" only because the check raced ahead of it, not because the
 * invariant actually holds. Two independent late-remeasure triggers
 * `useScrollHint` schedules and this waits out:
 *
 * - A webfont swap (`useWebfontSwap`, `document.fonts.ready`) — a first
 *   paint can measure with fallback-font metrics before the real face
 *   swaps in and reflows the track (mirrors `apps/web/test/e2e/
 *   scroll-arrows.spec.ts`'s deleted `settled()` helper, which existed for
 *   exactly this).
 * - A `ResizeObserver`/scroll-tick remeasure coalesced onto the next
 *   animation frame (`useScrollHint`'s `scheduleScrollCheck`) — two `rAF`
 *   round trips is enough to drain one coalesced callback plus the React
 *   re-render + effect flush it triggers.
 */
export async function settle(win: Window = window): Promise<void> {
  await win.document.fonts.ready;
  await new Promise<void>((resolve) =>
    win.requestAnimationFrame(() => resolve()),
  );
  await new Promise<void>((resolve) =>
    win.requestAnimationFrame(() => resolve()),
  );
}
