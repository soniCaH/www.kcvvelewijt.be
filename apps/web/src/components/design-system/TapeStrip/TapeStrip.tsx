import type { CSSProperties } from "react";

export type TapeStripColor = "jersey" | "ink" | "cream";
export type TapeStripPosition = "tl" | "tr" | "bl" | "br";
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

// Position the tape so its center sits on the card's edge — the tape spans
// the edge, ~half above (anchored to surrounding surface) and ~half below
// (anchored to the card). transform-origin: center keeps rotation balanced.
const POSITION_CLASS: Record<TapeStripPosition, string> = {
  tl: "absolute top-0 left-[12%] origin-center",
  tr: "absolute top-0 right-[12%] origin-center",
  bl: "absolute bottom-0 left-[12%] origin-center",
  br: "absolute bottom-0 right-[12%] origin-center",
};

// Per-position rotation lean — symmetric around the corner so the tape reads
// as anchoring outward toward the surrounding surface. Custom rotation is
// intentionally not exposed on the API: arbitrary degrees produce
// nonsensical results (tape barely overlapping the card edge).
const POSITION_ROTATION: Record<TapeStripPosition, number> = {
  tl: -10,
  tr: 10,
  bl: 10,
  br: -10,
};

export function TapeStrip({
  color = "jersey",
  position = "tl",
  length = "md",
}: TapeStripProps) {
  const rot = POSITION_ROTATION[position];
  const isTop = position === "tl" || position === "tr";
  const transY = isTop ? "-50%" : "50%";
  const style: CSSProperties = {
    transform: `translateY(${transY}) rotate(${rot}deg)`,
  };
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
