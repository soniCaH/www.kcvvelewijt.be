// Three hand-drawn-ish horizontal stroke paths. The colour is hard-coded into
// the SVG (urlencoded #4acf52) because it goes through a CSS data URL.
// preserveAspectRatio="none" lets the stroke stretch to any underlying word width.
export const STROKES = {
  a: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'><path d='M2 4 Q 20 2, 50 4 T 98 4' stroke='%234acf52' stroke-width='5' fill='none' stroke-linecap='round'/></svg>`,
  b: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'><path d='M3 5 Q 30 1, 60 5 T 97 4' stroke='%234acf52' stroke-width='6' fill='none' stroke-linecap='round'/></svg>`,
  c: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'><path d='M2 5 Q 25 6, 50 4 T 97 5' stroke='%234acf52' stroke-width='4' fill='none' stroke-linecap='round'/></svg>`,
} as const;
