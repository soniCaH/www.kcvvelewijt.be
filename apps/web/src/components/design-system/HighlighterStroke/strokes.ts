// Three highlighter passes. Real marker strokes are much closer to a clean
// rectangular slab than to a wavy organic shape — the wobble that reads as
// "fake hand-drawn" comes from over-curving the top and bottom edges. These
// variants ship as nearly-straight slabs with subtle slants and tapered ends
// so they look like a deliberate marker pass, not a designed sticker.
//
// Colour is hard-coded urlencoded #4acf52 because the SVG ships via a CSS
// data URL. preserveAspectRatio="none" lets the stroke stretch across any
// underlying word; with no large curves the stretch doesn't visibly distort.
export const STROKES = {
  // Variant a — clean horizontal pass, both ends slightly tapered.
  a: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 14' preserveAspectRatio='none'><path d='M 1 5.4 L 99 5.0 L 99 10.4 L 1 10.6 Z' fill='%234acf52' opacity='0.78'/></svg>`,

  // Variant b — thicker, slight angle as if the marker tip was held off-axis.
  b: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 14' preserveAspectRatio='none'><path d='M 1 4.4 L 99 5.0 L 99 11.0 L 1 10.6 Z' fill='%234acf52' opacity='0.85'/></svg>`,

  // Variant c — two thin overlapping passes, chiselled-tip feel.
  c: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 14' preserveAspectRatio='none'><path d='M 1 4.6 L 99 4.4 L 99 8.4 L 1 8.6 Z' fill='%234acf52' opacity='0.55'/><path d='M 1 6.8 L 99 7.0 L 99 10.8 L 1 10.6 Z' fill='%234acf52' opacity='0.55'/></svg>`,
} as const;
