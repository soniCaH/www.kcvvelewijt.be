// Path for the highlighter slab — confident pass with hand-pulled asymmetry.
// The path's fill colour is parameterised so consumers can render the marker
// in any of the brand colours by composing a data URL at call time.
//
// preserveAspectRatio="none" lets the stroke stretch across any underlying
// word; with no large curves the stretch doesn't visibly distort.
export const STROKE_PATH =
  "M 1 4.7 L 50 4.3 L 99 4.0 L 99 10.8 L 50 11.1 L 1 11.0 Z";

export type HighlighterStrokeColor = "jersey" | "jersey-deep" | "ink" | "cream";

// urlencoded hex (#) prefix for inlining inside an SVG data URL.
const COLOR_FILL: Record<HighlighterStrokeColor, string> = {
  jersey: "%234acf52",
  "jersey-deep": "%23008755",
  ink: "%230a0a0a",
  cream: "%23f5f1e6",
};

export function buildStrokeDataUrl(color: HighlighterStrokeColor): string {
  const fill = COLOR_FILL[color];
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 14' preserveAspectRatio='none'><path d='${STROKE_PATH}' fill='${fill}' opacity='0.85'/></svg>`;
}
