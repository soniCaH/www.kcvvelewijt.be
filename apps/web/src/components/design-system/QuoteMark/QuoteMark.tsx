export type QuoteMarkColor = "jersey" | "ink" | "cream";

export interface QuoteMarkProps {
  color?: QuoteMarkColor;
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
//
// `quote-mark-hang` (globals.css, D14/Y6 #2617) hangs this glyph — the pull
// quote's opening mark — outside the card's left padding so the card's
// actual reading column (the blockquote text below) keeps a straight edge.
export function QuoteMark({ color = "jersey" }: QuoteMarkProps) {
  return (
    <span
      data-color={color}
      aria-hidden="true"
      className={`quote-mark-hang font-body block text-[4.5rem] leading-[0.5] font-black tracking-[-0.05em] select-none ${COLOR_CLASS[color]}`}
      style={{ marginBottom: "-0.3em" }}
    >
      &rdquo;
    </span>
  );
}
