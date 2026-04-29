import type { CSSProperties } from "react";

export type TapeStripColor = "jersey" | "ink" | "cream";
export type TapeStripLength = "sm" | "md" | "lg";

export interface TapeStripProps {
  color?: TapeStripColor;
  length?: TapeStripLength;
}

const LENGTH_CLASS: Record<TapeStripLength, string> = {
  sm: "h-3 w-12",
  md: "h-4 w-16",
  lg: "h-5 w-24",
};

const COLOR_CLASS: Record<TapeStripColor, string> = {
  jersey: "bg-jersey",
  ink: "bg-ink",
  cream: "bg-cream",
};

// Single canonical placement: tape sits centered on the card's top edge,
// inset from the left. Both the inset and the rotation read from CSS
// custom properties so <TapedCardGrid> can auto-vary them per slot —
// tapes in the same grid row don't perfectly align horizontally or
// rotationally. Fallbacks are the standalone defaults.
const TAPE_TRANSFORM =
  "translateY(-50%) rotate(var(--tape-rotation, var(--rotate-tape-a)))";

export function TapeStrip({ color = "jersey", length = "lg" }: TapeStripProps) {
  const style: CSSProperties = { transform: TAPE_TRANSFORM };
  return (
    <span
      data-color={color}
      data-length={length}
      className={`${LENGTH_CLASS[length]} ${COLOR_CLASS[color]} absolute top-0 left-[var(--tape-left,12%)] block origin-center opacity-90`}
      style={style}
      aria-hidden="true"
    />
  );
}
