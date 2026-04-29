import { useId, type CSSProperties } from "react";

export type TapeStripColor = "jersey" | "ink" | "cream";
export type TapeStripPosition = "tl" | "tr" | "bl" | "br";
export type TapeStripLength = "sm" | "md" | "lg";

export interface TapeStripProps {
  color?: TapeStripColor;
  position?: TapeStripPosition;
  length?: TapeStripLength;
  rotation?: number;
}

const LENGTH_DIMENSIONS: Record<TapeStripLength, { w: number; h: number }> = {
  sm: { w: 48, h: 16 },
  md: { w: 72, h: 22 },
  lg: { w: 100, h: 28 },
};

const COLOR_FILL: Record<TapeStripColor, string> = {
  jersey: "var(--color-jersey)",
  ink: "var(--color-ink)",
  cream: "var(--color-cream)",
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
  const { w, h } = LENGTH_DIMENSIONS[length];
  const fill = COLOR_FILL[color];
  const id = useId().replace(/:/g, "");
  const grainId = `tape-grain-${id}`;
  const highlightId = `tape-highlight-${id}`;

  const style: CSSProperties = {
    transform: `rotate(${rot}deg)`,
    filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.20))",
  };

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      data-color={color}
      data-position={position}
      data-length={length}
      className={`${POSITION_CLASS[position]} block`}
      style={style}
      aria-hidden="true"
    >
      <defs>
        {/* Paper-fibre grain via fractal turbulence; alpha-only (translucent black) */}
        <filter id={grainId} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.4"
            numOctaves={2}
            stitchTiles="stitch"
          />
          <feColorMatrix
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0.22 0"
          />
        </filter>
        {/* Diagonal lighting highlight: leading-edge gloss → trailing-edge shadow */}
        <linearGradient
          id={highlightId}
          x1="0"
          y1="0"
          x2={w}
          y2={h}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="white" stopOpacity="0.28" />
          <stop offset="35%" stopColor="white" stopOpacity="0.06" />
          <stop offset="65%" stopColor="black" stopOpacity="0.04" />
          <stop offset="100%" stopColor="black" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      {/* Body — translucent so the underlying card edge bleeds through slightly */}
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        fill={fill}
        opacity="0.86"
        rx="1.5"
      />
      {/* Grain overlay */}
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        filter={`url(#${grainId})`}
        rx="1.5"
      />
      {/* Lighting highlight */}
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        fill={`url(#${highlightId})`}
        rx="1.5"
      />
    </svg>
  );
}
