import type { CSSProperties } from "react";

export type TapeStripColor = "jersey" | "ink" | "cream";
export type TapeStripPosition = "tl" | "tr" | "bl" | "br";
export type TapeStripLength = "sm" | "md" | "lg";

export interface TapeStripProps {
  color?: TapeStripColor;
  position?: TapeStripPosition;
  length?: TapeStripLength;
  rotation?: number;
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

const POSITION_CLASS: Record<TapeStripPosition, string> = {
  tl: "absolute -top-2 -left-2 origin-top-left",
  tr: "absolute -top-2 -right-2 origin-top-right",
  bl: "absolute -bottom-2 -left-2 origin-bottom-left",
  br: "absolute -bottom-2 -right-2 origin-bottom-right",
};

const DEFAULT_ROTATION: Record<TapeStripPosition, number> = {
  tl: -8,
  tr: 8,
  bl: 8,
  br: -8,
};

// Diagonal gradient overlay simulates the way real washi tape catches light:
// a soft highlight at the leading edge fading to a deeper shadow at the
// trailing edge. Combined with the base colour bg this gives the strip a
// paint-soaked-paper feel rather than a flat block, without the cost of an
// SVG / texture map.
const TAPE_OVERLAY = [
  "linear-gradient(",
  "  104deg,",
  "  rgba(255, 255, 255, 0.22) 0%,",
  "  rgba(255, 255, 255, 0.05) 35%,",
  "  rgba(0, 0, 0, 0.04) 65%,",
  "  rgba(0, 0, 0, 0.14) 100%",
  ")",
].join("\n");

export function TapeStrip({
  color = "jersey",
  position = "tl",
  length = "md",
  rotation,
}: TapeStripProps) {
  const rot = rotation ?? DEFAULT_ROTATION[position];
  const style: CSSProperties = {
    transform: `rotate(${rot}deg)`,
    backgroundImage: TAPE_OVERLAY,
  };
  return (
    <span
      data-color={color}
      data-position={position}
      data-length={length}
      className={`${POSITION_CLASS[position]} ${LENGTH_CLASS[length]} ${COLOR_CLASS[color]} block rounded-[1.5px] opacity-90 shadow-[0_1px_2px_rgba(0,0,0,0.18)]`}
      style={style}
      aria-hidden="true"
    />
  );
}
