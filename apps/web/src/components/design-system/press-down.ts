/**
 * Canonical paper press-down hover (feedback_canonical_press_down_hover).
 *
 * The locked press-down for paper-stamped interactive primitives, in ONE place:
 * on hover the card shifts +1/+1 into its offset shadow and the shadow collapses
 * flush, so the paper looks pressed against the page.
 *
 * Reduced-motion contract (the "translate-gated-only" canonical):
 * - the +1/+1 translate is gated behind `motion-safe:` — it is movement, so it
 *   is suppressed under `prefers-reduced-motion`;
 * - the `hover:shadow-none` collapse is NOT gated — it is a non-motion visual
 *   affordance, so reduced-motion users still get the "this is pressable" cue.
 *
 * Compose with `cn(PRESS_DOWN_CLASSES, "<other classes>")`. Self-hover only —
 * group-driven presses (e.g. <SponsorTile>, where the inner frame reacts to the
 * parent `group`) use `group-hover:`/`group-focus-visible:` and can't consume
 * this string. <TapedCard interactive="press"> implements the same model via a
 * CSS-variable transform rather than utility classes.
 */
export const PRESS_DOWN_CLASSES =
  "transition-all duration-300 hover:shadow-none motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1";
