import type { CSSProperties } from "react";

export type TapeStripColor = "jersey" | "ink" | "cream" | "warm";
export type TapeStripLength = "sm" | "md" | "lg";

/**
 * Horizontal anchor on the host's top edge.
 * - `"left"` (default) — inset from the left via `--tape-left` (default 12%).
 * - `"right"` — inset from the right via `--tape-right` (default 12%).
 *   Used by R10 NewsCard for the top-right corner strip pairing the
 *   top-left strip on the outer card frame.
 */
export type TapeStripPosition = "left" | "right";

/**
 * Optional per-strip rotation pick from `--rotate-tape-{a,b,c,d}`.
 * - Omitted (default) — reads `--tape-rotation` from the host's CSS
 *   context (fallback `--rotate-tape-a`). Right for grid slots that
 *   pre-set the var on each card.
 * - `"a" | "b" | "c" | "d"` — pins to the named pool entry.
 *   Used for corner-tape pairings (R10 NewsCard TL+TR) where the two
 *   strips on one card should lean in opposite directions.
 */
export type TapeStripRotation = "a" | "b" | "c" | "d";

export interface TapeStripProps {
  color?: TapeStripColor;
  length?: TapeStripLength;
  position?: TapeStripPosition;
  rotation?: TapeStripRotation;
}

const LENGTH_CLASS: Record<TapeStripLength, string> = {
  sm: "h-3 w-12",
  md: "h-4 w-16",
  lg: "h-5 w-24",
};

const COLOR_CLASS: Record<TapeStripColor, string> = {
  jersey: "bg-jersey",
  ink: "bg-ink",
  // Cream + warm use inline background-color sourced from tape-specific
  // tokens (`--color-tape-cream`, `--tape-warm`). Both tokens live on :root
  // so they cannot be expressed as Tailwind utilities without polluting the
  // color theme namespace with tape-specific values.
  cream: "",
  warm: "",
};

// Two anchor classes. Left reads `--tape-left` (12% fallback); right
// reads `--tape-right` (12% fallback). Both still share the rotation
// custom-property pool so consumer slots can vary rotation independently.
const POSITION_CLASS: Record<TapeStripPosition, string> = {
  left: "left-[var(--tape-left,12%)]",
  right: "right-[var(--tape-right,12%)]",
};

// Single canonical placement: tape sits centered on the card's top edge.
// Rotation reads from a CSS custom property so <TapedCardGrid> can
// auto-vary it per slot — tapes in the same grid row don't perfectly
// align rotationally. Fallback is the standalone default.
const TAPE_TRANSFORM =
  "translateY(-50%) rotate(var(--tape-rotation, var(--rotate-tape-a)))";

// When a per-strip rotation pick is passed explicitly, compose the
// transform around that pool entry directly (skipping --tape-rotation).
// Used by R10 NewsCard so TL + TR corner strips lean in opposite
// directions independent of the grid-supplied var.
const ROTATION_TOKEN: Record<TapeStripRotation, string> = {
  a: "var(--rotate-tape-a)",
  b: "var(--rotate-tape-b)",
  c: "var(--rotate-tape-c)",
  d: "var(--rotate-tape-d)",
};

export function TapeStrip({
  color = "jersey",
  length = "lg",
  position = "left",
  rotation,
}: TapeStripProps) {
  const transform = rotation
    ? `translateY(-50%) rotate(${ROTATION_TOKEN[rotation]})`
    : TAPE_TRANSFORM;
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
      data-rotation={rotation ?? "inherit"}
      // z-20 + pointer-events-none — tape strips must render above
      // sibling content that uses `position: absolute` (e.g. Next.js
      // `<Image fill>` in flush-edge `<NewsCard>`). The pointer-events
      // override keeps the tape decorative — the host's cover link
      // (z-10 inset-0) stays the only click target.
      className={`${LENGTH_CLASS[length]} ${COLOR_CLASS[color]} ${POSITION_CLASS[position]} pointer-events-none absolute top-0 z-20 block origin-center opacity-90`}
      style={style}
      aria-hidden="true"
    />
  );
}
