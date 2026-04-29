export type QuoteMarkColor = "jersey" | "ink" | "cream";

export interface QuoteMarkProps {
  color?: QuoteMarkColor;
}

const COLOR_CLASS: Record<QuoteMarkColor, string> = {
  jersey: "text-jersey-deep",
  ink: "text-ink",
  cream: "text-cream",
};

// Oversized Freight Big Pro italic open-quote glyph rendered as a graphic
// device — sized large enough to read as a magazine-pull-quote anchor rather
// than a literal punctuation mark. Slight negative top margin tucks the
// glyph above the body so its tail brushes the top of the quote text.
export function QuoteMark({ color = "jersey" }: QuoteMarkProps) {
  return (
    <span
      data-color={color}
      aria-hidden="true"
      className={`font-display-big block text-[5rem] leading-[0.55] italic select-none ${COLOR_CLASS[color]}`}
      style={{ marginBottom: "-0.45em" }}
    >
      &ldquo;
    </span>
  );
}
