export type QuoteMarkColor = "jersey" | "ink" | "cream";

export interface QuoteMarkProps {
  color?: QuoteMarkColor;
  /**
   * Hang the mark outside its container via `quote-mark-hang` (globals.css,
   * D14/Y6 #2617) — a fixed ~25px negative-indent pull sized for
   * `<PullQuote>`'s `<TapedCard padding="lg">` (32px), the sole production
   * consumer. Opt-in and default `false` rather than baked into the
   * primitive: a tighter wrapper (this component's own stories included —
   * `AllColours`' `p-2` is 8px) has less padding than the pull, and an
   * unconditional hang collides the glyph into its neighbours or drags it
   * off its own coloured ground.
   */
  hang?: boolean;
}

const COLOR_CLASS: Record<QuoteMarkColor, string> = {
  jersey: "text-jersey-deep",
  ink: "text-ink",
  cream: "text-cream",
};

// Heavy sans-serif right-double-quotation-mark glyph (U+201D) rendered as a
// single typographic mark — the font renders it as the bulb-and-tail double
// shape per the owner's reference. Freight Sans (font-body) at black weight
// gives the solid stroke. Tight letter-spacing pulls the two parts of the
// double-mark glyph closer together. Negative bottom margin tucks the mark
// up so its tail sits above the quote body.
export function QuoteMark({ color = "jersey", hang = false }: QuoteMarkProps) {
  return (
    <span
      data-color={color}
      aria-hidden="true"
      className={`${hang ? "quote-mark-hang" : ""}font-body block text-[4.5rem] leading-[0.5] font-black tracking-[-0.05em] select-none ${COLOR_CLASS[color]}`}
      style={{ marginBottom: "-0.3em" }}
    >
      &rdquo;
    </span>
  );
}
