/**
 * Ends a `play` that clicked a control which stays on screen (#3834).
 * Chromium paints `:focus-visible` only when the capture frame holds OS focus,
 * which varies per run, so a ring on that control makes the VR capture flaky.
 * Not for stories that declare a focused state (`data-vr-force-ring`) or whose
 * component moves focus on purpose.
 */
export const blurActive = (canvasElement: HTMLElement) =>
  (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
