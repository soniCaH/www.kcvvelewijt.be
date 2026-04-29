export type QuoteMarkColor = "jersey" | "ink" | "cream";

export interface QuoteMarkProps {
  color?: QuoteMarkColor;
}

const COLOR_CLASS: Record<QuoteMarkColor, string> = {
  jersey: "text-jersey",
  ink: "text-ink",
  cream: "text-cream",
};

// Typographic open-quote glyph rendered in Freight Display italic at display
// size. The visual matches the redesign's editorial-italic vocabulary far
// better than a custom geometric SVG (owner: previous teardrop SVG was
// rejected). Negative top margin pulls the glyph up so the natural baseline
// alignment of the apostrophe sits flush with the upper edge of the quote
// content area.
export function QuoteMark({ color = "jersey" }: QuoteMarkProps) {
  return (
    <span
      data-color={color}
      aria-hidden="true"
      className={`font-display block text-[length:var(--text-display-2xl)] leading-[0.6] italic select-none ${COLOR_CLASS[color]}`}
    >
      &ldquo;
    </span>
  );
}
