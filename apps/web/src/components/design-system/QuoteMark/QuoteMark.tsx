export type QuoteMarkColor = "jersey" | "ink" | "cream";

export interface QuoteMarkProps {
  color?: QuoteMarkColor;
}

const COLOR: Record<QuoteMarkColor, string> = {
  jersey: "var(--color-jersey-deep)",
  ink: "var(--color-ink)",
  cream: "var(--color-cream)",
};

// Two stacked "right double quotation mark" glyphs rendered as solid sans-
// serif drops with curved descender tails, per the owner's reference image.
// Each glyph is a filled circle (bulb) blended into a tapered curved tail.
// Stroke-free filled paths so the shape stays solid at any size.
export function QuoteMark({ color = "jersey" }: QuoteMarkProps) {
  const fill = COLOR[color];
  return (
    <svg
      data-color={color}
      role="presentation"
      aria-hidden="true"
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill={fill}
    >
      {/* Left glyph: bulb top + curved tail descending toward lower-left */}
      <path d="M 4 14 C 4 6 11 2 18 2 C 25 2 30 6 30 14 C 30 19 26 23 22 24 C 23 27 24 30 24 32 C 24 41 18 50 7 56 L 2 50 C 11 44 16 38 16 32 C 16 30 16 28 15 26 C 8 25 4 21 4 14 Z" />
      {/* Right glyph: identical shape, translated */}
      <path d="M 36 14 C 36 6 43 2 50 2 C 57 2 62 6 62 14 C 62 19 58 23 54 24 C 55 27 56 30 56 32 C 56 41 50 50 39 56 L 34 50 C 43 44 48 38 48 32 C 48 30 48 28 47 26 C 40 25 36 21 36 14 Z" />
    </svg>
  );
}
