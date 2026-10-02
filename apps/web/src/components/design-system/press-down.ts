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
  "transition-[transform,box-shadow] duration-300 hover:shadow-none motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1";

/**
 * The one chip (#3328, decided in #3303): every chip-shaped link on the
 * organigram pages and `<UpLink>` is this size, border and type — `border-2`,
 * `px-3 py-2`, `text-label` (11px), mono semibold uppercase, ink offset shadow.
 * The caller owns the fill and the border/text colour (cream or warm,
 * `border-ink` etc.). A leading `‹` goes up to the structural parent (only
 * `<UpLink>`), a trailing `→` goes onward.
 *
 * `CHIP_CLASSES` is the static shape: for a chip that is not itself pressable
 * (an inert label inside a clickable card). `CHIP_LINK_CLASSES` adds the
 * behaviour of a real link or button: the canonical press-down on hover, and
 * the same press on keyboard focus — un-gated by `motion-safe:`, because the
 * translate is how a keyboard user locates the focused chip. The ring is the
 * global one (`globals.css`), so a chip sets no outline of its own. Under `prefers-reduced-motion` the
 * transition is off (`motion-reduce:transition-none`): the focus press still
 * lands, but it snaps instead of sliding. A tone-swapped shadow is a colour
 * utility on top (`shadow-warm`), not a second constant.
 *
 * Compose with plain string concatenation, never `cn()`: tailwind-merge files
 * the custom `text-label` token under text-colour and drops it next to
 * `text-ink` / `text-cream` (#2769).
 */
export const CHIP_CLASSES =
  "text-label inline-flex w-fit items-center gap-1.5 border-2 px-3 py-2 font-mono font-semibold uppercase shadow-paper-sm";

export const CHIP_LINK_CLASSES = `${CHIP_CLASSES} ${PRESS_DOWN_CLASSES} focus-visible:translate-x-1 focus-visible:translate-y-1 focus-visible:shadow-none motion-reduce:transition-none`;
