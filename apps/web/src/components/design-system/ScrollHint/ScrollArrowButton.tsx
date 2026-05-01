import { cn } from "@/lib/utils/cn";

export interface ScrollArrowButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  /** Additional CSS classes — used by dark-context callers to swap shadow */
  className?: string;
}

/**
 * Single canonical 48 × 48 paper button with an italic Freight Display
 * `←` / `→` glyph. Direction D ("Paper chrome, ink emphasis") locked at
 * the Phase 2 Track B design checkpoint (2026-04-30). Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html
 * (`.arrow-btn` rules).
 *
 * The `variant` prop was retired — the cream-on-ink-bordered button reads
 * correctly on both cream panels (full ink shadow) and ink panels (callers
 * pass a soft-shadow `className` so the offset stays visible against the
 * dark background). Glyph is hardcoded typography, not a Phosphor icon —
 * favoured per the "typographic glyphs over Lucide where the glyph reads"
 * preference.
 */
export function ScrollArrowButton({
  direction,
  onClick,
  className,
}: ScrollArrowButtonProps) {
  const glyph = direction === "left" ? "←" : "→";
  const positionClass = direction === "left" ? "left-0" : "right-0";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Vertical centering via auto margins instead of `-translate-y-1/2`
        // so the `transform` property is free for the hover press idiom —
        // mixing them on one transform causes the centering to be lost on
        // hover and the button to leap to the top of its parent.
        "absolute inset-y-0 z-10 my-auto",
        "border-ink bg-cream h-12 w-12 rounded-none border-2",
        "shadow-paper-sm",
        "inline-flex items-center justify-center",
        // 22px matches the canonical mockup `.arrow-btn` font-size; pb-px
        // compensates for the italic Freight Display arrow glyph riding
        // slightly above the typographic baseline.
        "font-display text-ink pb-px text-[22px] leading-none italic",
        "transition-all duration-300",
        "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
        "focus-visible:ring-jersey-deep focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        positionClass,
        className,
      )}
      aria-label={`Scroll ${direction}`}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
