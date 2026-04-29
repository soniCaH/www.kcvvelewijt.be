import type { CSSProperties } from "react";

export type TapeStripColor = "jersey" | "ink" | "cream";
// Single canonical position. The card's offset shadow (bottom-right) means
// only the top edge can host a tape without shadow conflict.
export type TapeStripPosition = "tl";
export type TapeStripLength = "sm" | "md" | "lg";

export interface TapeStripProps {
  color?: TapeStripColor;
  position?: TapeStripPosition;
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

// Position the tape so its center sits on the card's top edge — the tape
// spans the edge, ~half above (anchored to surrounding surface) and ~half
// below (anchored to the card). transform-origin: center keeps rotation
// balanced.
const POSITION_CLASS: Record<TapeStripPosition, string> = {
  tl: "absolute top-0 left-[12%] origin-center",
};

// Tape rotation reads from a CSS custom property so <TapedCardGrid> can
// auto-vary the angle per slot (range -3deg → -6deg). Standalone tapes
// fall back to -5deg.
const TAPE_TRANSFORM = "translateY(-50%) rotate(var(--tape-rotation, -5deg))";

export function TapeStrip({
  color = "jersey",
  position = "tl",
  length = "md",
}: TapeStripProps) {
  const style: CSSProperties = { transform: TAPE_TRANSFORM };
  return (
    <span
      data-color={color}
      data-position={position}
      data-length={length}
      className={`${POSITION_CLASS[position]} ${LENGTH_CLASS[length]} ${COLOR_CLASS[color]} block opacity-90`}
      style={style}
      aria-hidden="true"
    />
  );
}
