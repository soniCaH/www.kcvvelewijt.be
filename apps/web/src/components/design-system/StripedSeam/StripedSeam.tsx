export type StripedSeamDirection = "horizontal" | "vertical";
export type StripedSeamHeight = "sm" | "md" | "lg";
/**
 * Two-tone stripe pair.
 * - `"ink-cream"` — high-contrast graphic seam (Phase 0 default).
 * - `"jersey-cream"` — softer brand-tonal seam.
 * - `"jersey-tonal"` — two shades of jersey green
 *   (`jersey-deep-dark` + `jersey-deep`). Reserved for surfaces that
 *   sit on the dark green field (e.g. the R6.C Clubshop section)
 *   where ink-on-cream would clash with the dark surround.
 */
export type StripedSeamColorPair =
  | "ink-cream"
  | "jersey-cream"
  | "jersey-tonal";

export interface StripedSeamProps {
  direction?: StripedSeamDirection;
  height?: StripedSeamHeight;
  colorPair?: StripedSeamColorPair;
  /**
   * Flip the diagonal angle from -45° to +45°. Used for the bottom
   * seam of a mirrored frame (R6.C clubshop) so the top and bottom
   * stripes lean toward each other and visually "tape" the section
   * as a discrete package.
   */
  flip?: boolean;
}

const HEIGHT_PX: Record<StripedSeamHeight, number> = { sm: 12, md: 18, lg: 24 };

const COLOR_PAIR_STROKES: Record<
  StripedSeamColorPair,
  { stroke1: string; stroke2: string }
> = {
  "ink-cream": { stroke1: "var(--color-ink)", stroke2: "var(--color-cream)" },
  "jersey-cream": {
    stroke1: "var(--color-jersey)",
    stroke2: "var(--color-cream)",
  },
  "jersey-tonal": {
    stroke1: "var(--color-jersey-deep-dark)",
    stroke2: "var(--color-jersey-deep)",
  },
};

export function StripedSeam({
  direction = "horizontal",
  height = "md",
  colorPair = "ink-cream",
  flip = false,
}: StripedSeamProps) {
  const h = HEIGHT_PX[height];
  const isVertical = direction === "vertical";
  const { stroke1, stroke2 } = COLOR_PAIR_STROKES[colorPair];
  const angle = flip ? 45 : -45;
  const patternId = `seam-pattern-${direction}-${height}-${colorPair}-${flip ? "flip" : "default"}`;
  return (
    <svg
      data-direction={direction}
      data-height={height}
      data-color-pair={colorPair}
      data-flip={flip ? "true" : "false"}
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
          patternTransform={`rotate(${angle})`}
        >
          <rect x="0" y="0" width="8" height="16" fill={stroke1} />
          <rect x="8" y="0" width="8" height="16" fill={stroke2} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
