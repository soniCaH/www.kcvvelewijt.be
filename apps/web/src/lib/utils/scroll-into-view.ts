/**
 * `Element.scrollIntoView` that honours `prefers-reduced-motion`: smooth by
 * default, instant when the visitor asked for less motion (DESIGN.md → Motion,
 * The Reduced-Motion Rule — everything that travels arrives instantly).
 * Client-only: reads `window.matchMedia`, so call it from an effect or handler.
 */
export function scrollIntoViewMotionSafe(
  el: Element,
  options: Omit<ScrollIntoViewOptions, "behavior"> = {},
): void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ ...options, behavior: reduced ? "instant" : "smooth" });
}
