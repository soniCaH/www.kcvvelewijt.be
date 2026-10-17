/**
 * Movable blocks (#3537). A story's text groups are blocks the editor drags
 * anywhere; each moved block keeps an offset in capture pixels, rendered as a
 * translate on the block in its default place. No clamping, no push-apart:
 * the tool never moves a block by itself.
 */

export type BlockLayer = "voor" | "achter";

/**
 * Per block id, its offset and layer. Key order is move order: the block
 * moved last is the last key, and sits on top of the other movable blocks.
 */
export type BlockLayout = Record<
  string,
  { x: number; y: number; layer: BlockLayer }
>;

/** How close (capture px) a block's centre must come to the canvas centre to snap. */
export const SNAP_PX = 24;

/**
 * The offset for a block being dragged: the pointer delta since pointer-down
 * (never `movementX/Y`, which reads 0 on some touch moves) divided by the
 * preview scale, added to the offset at pointer-down. With `snap` on, a
 * block whose horizontal centre lands within {@link SNAP_PX} of the canvas
 * centre snaps onto it.
 */
export function moveBlock({
  from,
  dx,
  dy,
  scale,
  centre,
  width,
  snap,
}: {
  /** The block's offset at pointer-down. */
  from: { x: number; y: number };
  /** Pointer delta since pointer-down, in screen px. */
  dx: number;
  dy: number;
  /** Preview scale (screen px per capture px). */
  scale: number;
  /** The block's horizontal centre at pointer-down, in capture px. */
  centre: number;
  /** Canvas width in capture px. */
  width: number;
  snap: boolean;
}): { x: number; y: number; snapped: boolean } {
  const x = from.x + dx / scale;
  const y = from.y + dy / scale;
  const target = width / 2 - (centre - from.x);
  if (snap && Math.abs(x - target) <= SNAP_PX) {
    return { x: target, y, snapped: true };
  }
  return { x, y, snapped: false };
}

/** `layout` with `id` moved to `at`, as the last key (on top). */
export function placeBlock(
  layout: BlockLayout,
  id: string,
  at: { x: number; y: number },
): BlockLayout {
  const { [id]: prev, ...rest } = layout;
  return { ...rest, [id]: { x: at.x, y: at.y, layer: prev?.layer ?? "voor" } };
}

// Stacking tiers in the four new looks: photo (and wash) below 10, `achter`
// blocks from 10, pinned parts (crest, footer, seam, frame) at 20, `voor`
// blocks from 30. An unmoved block is `voor`.
export const PINNED_Z = 20;

/** z-index of a block in looks A–E: its tier plus its move order. */
export function blockZ(layout: BlockLayout, id: string): number {
  const order = Object.keys(layout).indexOf(id) + 1;
  return (layout[id]?.layer === "achter" ? 10 : 30) + order;
}

/**
 * z-index of a W Wedstrijd block. W's top row and footer are plain flow
 * content, so an `achter` block takes a negative z-index (under them, still
 * over the photo, which sits below the content column); `voor` is positive.
 */
export function wedstrijdZ(layout: BlockLayout, id: string): number {
  const order = Object.keys(layout).indexOf(id) + 1;
  return layout[id]?.layer === "achter" ? order - 50 : order;
}
