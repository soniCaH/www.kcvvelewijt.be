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

export function TapeStrip({
  color = "jersey",
  position = "tl",
  length = "md",
  rotation,
}: TapeStripProps) {
  const rot = rotation ?? DEFAULT_ROTATION[position];
  const style: CSSProperties = { transform: `rotate(${rot}deg)` };
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
