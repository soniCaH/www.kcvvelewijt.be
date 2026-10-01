import type { CSSProperties } from "react";

export type TapeStripColor =
  "jersey" | "jersey-deep" | "ink" | "cream" | "warm";
export type TapeStripLength = "sm" | "md" | "lg";

/**
 * Horizontal anchor on the host's chosen edge.
 * - `"left"` (default) — inset from the left via `--tape-left` (default 12%).
 * - `"right"` — inset from the right via `--tape-right` (default 12%).
 *   Used by R10 NewsCard for the top-right corner strip pairing the
 *   top-left strip on the outer card frame.
 */
export type TapeStripPosition = "left" | "right";

/**
 * Vertical anchor on the host card.
 * - `"top"` (default) — strip sits on the top edge (legacy behavior;
 *   `translateY(-50%)` lifts it half above the edge so the tape
 *   visually overlaps the card boundary).
 * - `"bottom"` — strip sits on the bottom edge (`translateY(50%)`
 *   drops it half below). Used by the `<EventFactInline>` polaroid
 *   to pin a bottom-right tape strip per eventfact-inline-locked §Round 1.
 */
export type TapeStripVerticalEdge = "top" | "bottom";

/**
 * The tape strip's angle, drawn from the site's bigger tilt tier
 * (`globals.css`, #3302 / #3329): `a` -6°, `b` -4°, `c` -2°, `d` +2°,
 * `e` +4°, `f` +6°. `none` is the explicit flat strip. The tier has no 0
 * and never goes under 2°, so a tilted strip never reads as flat.
 */
export type TapeStripRotation = "a" | "b" | "c" | "d" | "e" | "f" | "none";

/** The six tilted entries, negative first (`a`-`c`) then positive (`d`-`f`). */
const TAPE_ROTATION_POOL = ["a", "b", "c", "d", "e", "f"] as const;

// djb2-light string hash — deterministic, so a card's tape angle is stable
// across renders (no hydration mismatch, stable VR baselines).
function hashIndex(seed: string, modulo: number): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

/**
 * The tape angle a card's identity derives: the same seed gives the same
 * angle on every page the card appears on.
 */
export function tapeRotationFor(
  seed: string,
): (typeof TAPE_ROTATION_POOL)[number] {
  return TAPE_ROTATION_POOL[hashIndex(seed, TAPE_ROTATION_POOL.length)]!;
}

/**
 * The strip that leans the other way: three entries along the pool, so a
 * negative entry always meets a positive one (`a`↔`d`, `b`↔`e`, `c`↔`f`).
 */
export function oppositeTapeRotation(
  rotation: (typeof TAPE_ROTATION_POOL)[number],
): (typeof TAPE_ROTATION_POOL)[number] {
  const half = TAPE_ROTATION_POOL.length / 2;
  return TAPE_ROTATION_POOL[
    (TAPE_ROTATION_POOL.indexOf(rotation) + half) % TAPE_ROTATION_POOL.length
  ]!;
}

export interface TapeStripProps {
  color?: TapeStripColor;
  length?: TapeStripLength;
  position?: TapeStripPosition;
  verticalEdge?: TapeStripVerticalEdge;
  /**
   * Pins the angle to a named entry of the bigger tier. Wins over `seed`.
   * Used where two strips on one card must lean in opposite directions.
   */
  rotation?: TapeStripRotation;
  /**
   * A stable identity string (a title, a name) the angle is derived from —
   * the tape follows the card, not the grid slot it sits in. With neither
   * `seed` nor `rotation` the strip is flat (`none`): an un-seeded tape has
   * not said what it is.
   */
  seed?: string;
}

const LENGTH_CLASS: Record<TapeStripLength, string> = {
  sm: "h-3 w-12",
  md: "h-4 w-16",
  lg: "h-5 w-24",
};

const COLOR_CLASS: Record<TapeStripColor, string> = {
  jersey: "bg-jersey",
  "jersey-deep": "bg-jersey-deep",
  ink: "bg-ink",
  // Cream + warm use inline background-color sourced from tape-specific
  // tokens (`--color-tape-cream`, `--tape-warm`). Both tokens live on :root
  // so they cannot be expressed as Tailwind utilities without polluting the
  // color theme namespace with tape-specific values.
  cream: "",
  warm: "",
};

// Two anchor classes. Left reads `--tape-left` (12% fallback); right
// reads `--tape-right` (12% fallback). The inset is placement, so it stays
// slot-driven; the angle is the card's identity (`seed` / `rotation`).
const POSITION_CLASS: Record<TapeStripPosition, string> = {
  left: "left-[var(--tape-left,12%)]",
  right: "right-[var(--tape-right,12%)]",
};

// Edge-aware vertical anchor. `top` keeps the legacy `top-0` + `translateY(-50%)`
// pairing (tape sits half above the card edge). `bottom` mirrors it with
// `bottom-0` + `translateY(50%)` (tape sits half below the card edge).
const VERTICAL_EDGE_CLASS: Record<TapeStripVerticalEdge, string> = {
  top: "top-0",
  bottom: "bottom-0",
};

const TRANSLATE_Y: Record<TapeStripVerticalEdge, string> = {
  top: "-50%",
  bottom: "50%",
};

const ROTATION_TOKEN: Record<TapeStripRotation, string> = {
  a: "var(--rotate-tape-a)",
  b: "var(--rotate-tape-b)",
  c: "var(--rotate-tape-c)",
  d: "var(--rotate-tape-d)",
  e: "var(--rotate-tape-e)",
  f: "var(--rotate-tape-f)",
  none: "0deg",
};

export function TapeStrip({
  color = "jersey",
  length = "lg",
  position = "left",
  verticalEdge = "top",
  rotation,
  seed,
}: TapeStripProps) {
  const resolved: TapeStripRotation =
    rotation ?? (seed === undefined ? "none" : tapeRotationFor(seed));
  const transform = `translateY(${TRANSLATE_Y[verticalEdge]}) rotate(${ROTATION_TOKEN[resolved]})`;
  const style: CSSProperties = { transform };
  if (color === "warm") {
    style.backgroundColor = "var(--tape-warm)";
  } else if (color === "cream") {
    style.backgroundColor = "var(--color-tape-cream)";
  }
  return (
    <span
      data-color={color}
      data-length={length}
      data-position={position}
      data-vertical-edge={verticalEdge}
      data-rotation={resolved}
      // z-20 + pointer-events-none — tape strips must render above
      // sibling content that uses `position: absolute` (e.g. Next.js
      // `<Image fill>` in flush-edge `<NewsCard>`). The pointer-events
      // override keeps the tape decorative — the host's cover link
      // (z-10 inset-0) stays the only click target.
      className={`${LENGTH_CLASS[length]} ${COLOR_CLASS[color]} ${POSITION_CLASS[position]} ${VERTICAL_EDGE_CLASS[verticalEdge]} pointer-events-none absolute z-20 block origin-center opacity-90`}
      style={style}
      aria-hidden="true"
    />
  );
}
