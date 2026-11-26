/** Client-only: reads `window.matchMedia`, so call it from an effect or handler. */
const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * `Element.scrollIntoView` that honours `prefers-reduced-motion`: smooth by
 * default, instant when the visitor asked for less motion (DESIGN.md → Motion,
 * The Reduced-Motion Rule — everything that travels arrives instantly).
 * Client-only: reads `window.matchMedia`, so call it from an effect or handler.
 */
export const scrollIntoViewMotionSafe = (
  el: Element,
  options: Omit<ScrollIntoViewOptions, "behavior"> = {},
): void => {
  el.scrollIntoView({
    ...options,
    behavior: prefersReducedMotion() ? "instant" : "smooth",
  });
};

/**
 * `window.scrollTo` the top of the page, `"auto"` (a jump) under
 * `prefers-reduced-motion: reduce`, `"smooth"` otherwise. The preference is
 * read at the call, not cached: it can change while the page is open.
 */
export const scrollToTopMotionSafe = (): void => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
};
