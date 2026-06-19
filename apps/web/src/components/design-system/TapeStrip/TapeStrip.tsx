import type { CSSProperties } from "react";

export type TapeStripColor =
  | "jersey"
  | "jersey-deep"
  | "ink"
  | "cream"
  | "warm";
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
 * Optional per-strip rotation pick from the named tape rotation pools.
 * - Omitted (default) — reads `--tape-rotation` from the host's CSS
 *   context (fallback `--rotate-tape-a`). Right for grid slots that
 *   pre-set the var on each card.
 * - `"a" | "b" | "c" | "d"` — pins to the sub-degree pool entry
 *   (range -0.5° to +0.5°, per `feedback_visual_preferences` + Phase 1
 *   §11.5). Used for corner-tape pairings (R10 NewsCard TL+TR) where
 *   the two strips on one card should lean in opposite directions.
 * - `"polaroid-a" | "polaroid-b"` — pins to the polaroid-scale pool
 *   (`-5deg` / `+4deg`). Scoped to the `<EventFactInline>` polaroid
 *   composition only (eventfact-inline-locked.md §Round 1). The
 *   sub-degree pool stays canonical for grid cards; these steeper
 *   angles exist because the polaroid aesthetic needs visibly tilted
 *   tape. Do not use elsewhere — add a new scale-specific token when
 *   a new use case earns it.
 */
export type TapeStripRotation =
  | "a"
  | "b"
  | "c"
  | "d"
  | "polaroid-a"
  | "polaroid-b";

export interface TapeStripProps {
  color?: TapeStripColor;
  length?: TapeStripLength;
  position?: TapeStripPosition;
  verticalEdge?: TapeStripVerticalEdge;
  rotation?: TapeStripRotation;
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
// reads `--tape-right` (12% fallback). Both still share the rotation
// custom-property pool so consumer slots can vary rotation independently.
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

// When no per-strip rotation pick is passed, rotation reads from a CSS
// custom property so <TapedCardGrid> can auto-vary it per slot — tapes in
// the same grid row don't perfectly align rotationally. Fallback is the
// standalone default.
const tapeTransform = (edge: TapeStripVerticalEdge) =>
  `translateY(${TRANSLATE_Y[edge]}) rotate(var(--tape-rotation, var(--rotate-tape-a)))`;

// When a per-strip rotation pick is passed explicitly, compose the
// transform around that pool entry directly (skipping --tape-rotation).
// Used by R10 NewsCard so TL + TR corner strips lean in opposite
// directions independent of the grid-supplied var; and by EventFactInline
// for the polaroid-scale rotations.
const ROTATION_TOKEN: Record<TapeStripRotation, string> = {
  a: "var(--rotate-tape-a)",
  b: "var(--rotate-tape-b)",
  c: "var(--rotate-tape-c)",
  d: "var(--rotate-tape-d)",
  "polaroid-a": "var(--rotate-tape-polaroid-a)",
  "polaroid-b": "var(--rotate-tape-polaroid-b)",
};

export function TapeStrip({
  color = "jersey",
  length = "lg",
  position = "left",
  verticalEdge = "top",
  rotation,
}: TapeStripProps) {
  const transform = rotation
    ? `translateY(${TRANSLATE_Y[verticalEdge]}) rotate(${ROTATION_TOKEN[rotation]})`
    : tapeTransform(verticalEdge);
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
      data-rotation={rotation ?? "inherit"}
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
