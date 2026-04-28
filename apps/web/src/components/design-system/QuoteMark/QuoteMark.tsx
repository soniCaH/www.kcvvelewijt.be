export type QuoteMarkColor = "jersey" | "ink" | "cream";

export interface QuoteMarkProps {
  color?: QuoteMarkColor;
}

const COLOR: Record<QuoteMarkColor, string> = {
  jersey: "var(--color-jersey)",
  ink: "var(--color-ink)",
  cream: "var(--color-cream)",
};

export function QuoteMark({ color = "jersey" }: QuoteMarkProps) {
  return (
    <svg
      data-color={color}
      role="presentation"
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={COLOR[color]}
    >
      {/* Two slanted open-quote teardrops, stacked side-by-side */}
      <path d="M4 6 C4 4 6 3 8 3 L8 9 C6 9 5 10 5 12 L4 12 Z" />
      <path d="M14 6 C14 4 16 3 18 3 L18 9 C16 9 15 10 15 12 L14 12 Z" />
    </svg>
  );
}
