import { cn } from "@/lib/utils/cn";

export type ScrollArrowButtonRegister = "paper" | "control";

export interface ScrollArrowButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  /**
   * Which skin the arrow wears (#2444 resolution — "one arrow object in two
   * registers", chosen by whether the scrolled content is itself a paper
   * object at a much larger scale than the button):
   *
   * - `"paper"` — 48 × 48, cream fill, ink border, `--shadow-paper-sm`,
   *   italic Freight glyph. The card slider's only register: the content
   *   beside it (news cards) is itself paper at a much larger scale, so the
   *   arrow wears the same material and reads as chrome by the scale gap
   *   alone.
   * - `"control"` — 32 × 32, filled `jersey-deep` with a cream glyph, same
   *   border/shadow/glyph vocabulary otherwise. Everywhere else: a chip row,
   *   a table, a nav strip, a breadcrumb, a diagram. None of those are paper
   *   objects near the button's own scale, so at 32px the paper skin reads
   *   as a peer of the thing it sits beside instead of chrome — round 2 of
   *   #2444 found the clash was never about position, it was the arrow and
   *   the chip being the *same object*. `jersey-deep` is a fill no chip or
   *   crumb can wear, so the fill alone says "control".
   */
  register: ScrollArrowButtonRegister;
  /**
   * Renders the button inert without unmounting it. Used where the row
   * holds space for the arrow regardless of direction (#2489 resolution
   * part 3: "the spent direction stays, disabled in place ... a dim button
   * names the slot and goes live on the first scroll") — never used by a
   * surface that has no held space to explain, which simply mounts and
   * unmounts the button per direction instead.
   */
  disabled?: boolean;
  /** Additional CSS classes — used by dark-context callers to swap shadow */
  className?: string;
}

const REGISTER_CLASSES: Record<ScrollArrowButtonRegister, string> = {
  paper: cn(
    "h-12 w-12",
    "bg-cream text-ink",
    // 22px matches the canonical mockup `.arrow-btn` font-size; pb-px
    // compensates for the italic Freight Display arrow glyph riding
    // slightly above the typographic baseline.
    "font-display text-[22px] pb-px italic",
  ),
  control: cn(
    "h-8 w-8",
    "bg-jersey-deep text-cream",
    "font-display text-base italic",
    // Tap Target Rule (DESIGN.md, #3237): a bordered 32 × 32 control can't
    // grow via padding + negative margin (the border would grow with it),
    // so `hit-area`'s transparent `::before` supplies the 44 × 44 hit box
    // instead — the same idiom `ContactCard`, `HubSearch`'s clear button and
    // `OrganigramExplorer`'s sibling arrows already use. This button is
    // itself `position: absolute` (below); `hit-area`'s own `position:
    // relative` loses that cascade tie to the later-declared `.absolute`
    // rule (verified against the compiled CSS), so the button's own
    // placement is unaffected — only the pseudo-element's containing block
    // matters here, and `absolute` already provides one.
    "hit-area",
  ),
};

/**
 * The one arrow object, in two registers (#2444, as amended by #2476,
 * #2478 and #2489 — see the `register` and `disabled` docs above). Both
 * registers share the same 2px ink border, `--shadow-paper-sm`, sharp
 * corners, and the canonical press-down hover — only the size, fill and
 * glyph colour vary. `register` was retired once (this docblock's prior
 * text called the button "the single canonical 48 × 48 paper button" and
 * said "the variant prop was retired") because that axis conflated a real
 * distinction (light vs. dark host panel — solved by the `className`
 * shadow override, unchanged) with one that didn't exist yet (what the
 * button is made of). This is the second axis, not a reversal of the
 * first: a dark-panel `control` arrow (the organigram breadcrumb) still
 * takes the `className` soft-shadow override same as before.
 */
export function ScrollArrowButton({
  direction,
  onClick,
  register,
  disabled = false,
  className,
}: ScrollArrowButtonProps) {
  const glyph = direction === "left" ? "←" : "→";
  const positionClass = direction === "left" ? "left-0" : "right-0";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Vertical centering via auto margins instead of `-translate-y-1/2`
        // so the `transform` property is free for the hover press idiom —
        // mixing them on one transform causes the centering to be lost on
        // hover and the button to leap to the top of its parent.
        "absolute inset-y-0 z-10 my-auto",
        "border-ink rounded-none border-2",
        "shadow-paper-sm",
        "inline-flex items-center justify-center",
        "leading-none",
        "transition-all duration-300",
        "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
        // `pointer-events-none` also stops :hover from matching, so a spent
        // arrow held in place by a reserved rail never plays the press-down
        // animation for a click it will not accept.
        "disabled:pointer-events-none disabled:opacity-40",
        REGISTER_CLASSES[register],
        positionClass,
        className,
      )}
      aria-label={`Scroll ${direction}`}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
