export type StripedSeamDirection = "horizontal" | "vertical";
export type StripedSeamHeight = "sm" | "md" | "lg";
export type StripedSeamColorPair = "ink-cream" | "jersey-cream";

export interface StripedSeamProps {
  direction?: StripedSeamDirection;
  height?: StripedSeamHeight;
  colorPair?: StripedSeamColorPair;
}

const HEIGHT_PX: Record<StripedSeamHeight, number> = { sm: 12, md: 18, lg: 24 };

export function StripedSeam({
  direction = "horizontal",
  height = "md",
  colorPair = "ink-cream",
}: StripedSeamProps) {
  const h = HEIGHT_PX[height];
  const isVertical = direction === "vertical";
  const stroke1 =
    colorPair === "ink-cream" ? "var(--color-ink)" : "var(--color-jersey)";
  const stroke2 = "var(--color-cream)";
  const patternId = `seam-pattern-${direction}-${height}-${colorPair}`;
  return (
    <svg
      data-direction={direction}
      data-height={height}
      data-color-pair={colorPair}
      role="presentation"
      aria-hidden="true"
      width={isVertical ? h : "100%"}
      height={isVertical ? "100%" : h}
      style={{ display: "block" }}
    >
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width="16"
          height="16"
          patternTransform="rotate(-45)"
        >
          <rect x="0" y="0" width="8" height="16" fill={stroke1} />
          <rect x="8" y="0" width="8" height="16" fill={stroke2} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
