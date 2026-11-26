/**
 * Deterministic per-player figure variance for `<JerseyIllustration>` (#2635),
 * hardcoded to that component's 220×300 full-figure viewBox and this exact
 * lever set — it is not a general containment mechanism. `<JerseyShirt>`
 * crops to a different viewBox (`0 120 220 180`) and could not reuse it.
 *
 * A player with no photo used to draw the identical constant figure, so a
 * squad of 26 read as 26 copies. This module derives a per-player variant —
 * registration offset, opacity, scale, crop, mirror, head/shoulder/torso
 * geometry, sleeve length and shirt pattern — from a djb2 hash of a stable
 * per-player seed (`playerFigureSeed`, below — an id, never a display
 * name), so the same player draws the same figure every render, every
 * season, and server and client agree (no `Math.random`, no DOM
 * measurement anywhere in this file).
 *
 * The lever ranges and the two-part containment guard are ported verbatim
 * from the design drill that decided them:
 *  - `docs/design/mockups/2542-squad-photo-coverage/2542-2-variatie-studie.html`
 *    — the seed, the PRNG, the lever ranges, and the top/side guard (#2542's
 *    addendum: shrink-to-fit, then shift so no shoulder or the head crosses
 *    the 4px margin, at most 8 passes).
 *  - `docs/design/mockups/2590-non-cutout-photos/2590-1-niet-uitgeknipt.html`
 *    — the bottom clamp (#2590's correction): after the existing passes, if
 *    the torso stops short of the viewBox bottom, shift down to meet it.
 *    Shifting down can never re-expose the top guard, so it runs once,
 *    un-looped, after the 8-pass loop settles.
 *
 * The PRNG draw order matches the mockups exactly — including a `scale`
 * draw that gets immediately superseded by a wider one later — so a given
 * seed maps to the same visual result the drill measured its verified
 * numbers against (0 clipped, 15-of-26-short → 0). Those numbers are a
 * property of the lever ranges plus the guard, not of any particular seed
 * sample — switching the seed source (from a display name to a stable id,
 * per code review) changes which look a given player draws, not whether
 * the guard holds.
 */

import {
  JERSEY_ARM_REACH_HALF_WIDTH,
  JERSEY_FIGURE_VIEWBOX_HEIGHT,
  JERSEY_FIGURE_VIEWBOX_WIDTH,
  JERSEY_HEAD_ELLIPSE,
  JERSEY_OUTLINE_STROKE_WIDTH,
  JERSEY_TORSO_HALF_WIDTH,
} from "../_jersey-paths";

export const SHIRT_PATTERNS = ["bands", "hoops", "dots", "plain"] as const;
export type ShirtPattern = (typeof SHIRT_PATTERNS)[number];

export const SLEEVE_LENGTHS = ["short", "long"] as const;
export type SleeveLength = (typeof SLEEVE_LENGTHS)[number];

export const STRIPE_COUNTS = [3, 4, 5] as const;
export type StripeCount = (typeof STRIPE_COUNTS)[number];

export interface PlayerFigureVariant {
  /** Uniform scale of the whole figure (garment geometry lever: 0.84–1.16, pre-guard). */
  scale: number;
  /** Small positional jitter, x axis — part of the seeded "scale" draw, not the registration offset. */
  offsetX: number;
  /** Small positional jitter, y axis. */
  offsetY: number;
  /** Crop lever — how much of the torso shows. Also carries the containment guard's vertical corrections. */
  drop: number;
  /** Paper rotation, degrees (±0.9°). */
  rotation: number;
  /** Posture lean — a skewX, degrees (±3°). */
  lean: number;
  /** Underprint (fill) layer opacity (0.74–1.0). */
  underprintOpacity: number;
  /** Overprint (outline) layer opacity (0.82–1.0). */
  overprintOpacity: number;
  /**
   * Overprint registration misalignment, x axis, in the SAME viewBox units
   * as every other lever (−3…+4) — applied as a `<g transform="translate(…)">`
   * wrapping the overprint pass, one step after the shared base transform,
   * matching the design drill. NOT a CSS pixel offset: at card size that
   * would put the offset outside the geometry the containment guard bounds.
   */
  registrationX: number;
  /** Overprint registration misalignment, y axis (−3…+4). Same units caveat as `registrationX`. */
  registrationY: number;
  /** Horizontal mirror: 1 = as-drawn, -1 = flipped. */
  flip: 1 | -1;
  /** Head tilt, degrees (±5°). */
  headTilt: number;
  /** Head vertical offset, px (±6px). */
  headDy: number;
  /** Shoulder-bump width scale (0.88–1.12). */
  shoulderWidth: number;
  /** Torso build — horizontal scale of the torso + shoulders (0.86–1.14). */
  build: number;
  /** Sleeve length — short keeps today's shoulder bump; long extends it into an arm. */
  sleeve: SleeveLength;
  /** Shirt pattern. The club runs both a striped senior kit and a dotted youth kit. */
  pattern: ShirtPattern;
  /** Vertical-band count when `pattern === "bands"` (also selects the stripe set for outline detail). */
  stripeCount: StripeCount;
}

export interface FigureBoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** The full-figure viewBox is `_jersey-paths.ts`'s `JERSEY_FIGURE_VIEWBOX`. */
export const FIGURE_VIEWBOX_WIDTH = JERSEY_FIGURE_VIEWBOX_WIDTH;
export const FIGURE_VIEWBOX_HEIGHT = JERSEY_FIGURE_VIEWBOX_HEIGHT;

/** Breathing room inside the viewBox the guard keeps clear on every side. */
export const CONTAINMENT_MARGIN = 4;

/** Half the outline stroke, plus a hair of slack — added to every extent. */
const STROKE_ALLOWANCE = JERSEY_OUTLINE_STROKE_WIDTH / 2 + 0.5;

/**
 * The shift-then-shrink loop's termination cap — NOT a convergence bound.
 * Measured over 200k seeds: 88% exit by pass 1, 99.97% by pass 3, and 0.025%
 * (50/200,000) exhaust all 8 without converging — they oscillate, because
 * the `+ 0.5` width slack below lets a box up to 212.5 wide skip the shrink,
 * after which fixing `minX` pushes `maxX` back out. Those oscillating seeds'
 * final positions genuinely depend on the count being 8 — this is
 * drill-verbatim; do not "fix" it by rewriting the loop.
 */
const MAX_CONTAINMENT_PASSES = 8;

/** Below this, a pass is treated as converged rather than looping again. */
const SNAP_EPSILON = 0.4;

/**
 * djb2 (XOR variant) over the seed input. Matches the algorithm decided in
 * #2542's addendum — do not switch to the additive djb2 used by
 * `hashMemberId` (a different, unrelated hash with a different purpose:
 * masking ids before they reach analytics, not seeding a PRNG).
 */
export const djb2Seed = (input: string): number => {
  const hash = Array.from({ length: input.length }, (_, i) =>
    input.charCodeAt(i),
  ).reduce((acc, code) => (acc * 33) ^ code, 5381);
  return hash >>> 0;
};

/**
 * Canonical seed input for a player's figure — the player's own stable
 * identity, never a display name. A name (`${firstName} ${lastName}`) is
 * editable: a typo fix, a diacritic correction, or a married name would
 * silently redraw the figure, and two players who happen to share a display
 * name would draw the identical figure side by side in the same grid — the
 * exact "26 copies of one figure" symptom this feature exists to kill.
 * `id` should be immutable and never empty (e.g. the Sanity `_id`) — unlike
 * a name, which `toPlayerVM` defaults to `""` for an unauthored player.
 *
 * One owner for what the seed string is, so every consumer agrees: a
 * player must draw the same figure on `<PlayerCard>` and `<PlayerHero>`
 * alike, not just within either component on its own.
 */
export interface PlayerFigureIdentity {
  id: string;
}

export const playerFigureSeed = (player: PlayerFigureIdentity): string => {
  return player.id;
};

/** A stable xorshift32 stream — the same seed always yields the same draws in the same order. */
const createPrngStream = (seed: number): (() => number) => {
  const stream = { state: seed || 1 };
  return () => {
    stream.state ^= stream.state << 13;
    stream.state >>>= 0;
    stream.state ^= stream.state >> 17;
    stream.state ^= stream.state << 5;
    stream.state >>>= 0;
    return stream.state / 4_294_967_296;
  };
};

const span = (random: () => number, lo: number, hi: number): number => {
  return lo + random() * (hi - lo);
};

/**
 * The seeded levers, before the containment guard runs. Draw order matches
 * the design drill exactly, including the discarded first `scale` draw —
 * changing the order changes which seed maps to which look.
 */
export const generateRawPlayerFigureVariant = (
  seed: number,
): PlayerFigureVariant => {
  const random = createPrngStream(seed);

  // Superseded by the wider `scale` draw at the end of this function — the
  // draw still has to happen so every later lever lands on the same PRNG
  // position the drill measured its verified numbers against.
  void span(random, 0.9, 1.1);
  const offsetX = span(random, -9, 9);
  const offsetY = span(random, -7, 7);
  const rotation = span(random, -0.9, 0.9);
  const underprintOpacity = span(random, 0.74, 1);
  const overprintOpacity = span(random, 0.82, 1);
  const registrationX = span(random, -3, 4);
  const registrationY = span(random, -3, 4);

  const flip: 1 | -1 = random() < 0.5 ? -1 : 1;
  const headTilt = span(random, -5, 5);
  const headDy = span(random, -6, 6);
  const shoulderWidth = span(random, 0.88, 1.12);
  const stripeCount =
    STRIPE_COUNTS[Math.floor(random() * STRIPE_COUNTS.length)]!;

  const sleeve: SleeveLength = random() < 0.45 ? "long" : "short";
  const build = span(random, 0.86, 1.14);
  const lean = span(random, -3, 3);
  const pattern = SHIRT_PATTERNS[Math.floor(random() * SHIRT_PATTERNS.length)]!;
  const drop = span(random, -14, 16);
  const scale = span(random, 0.84, 1.16);

  return {
    scale,
    offsetX,
    offsetY,
    drop,
    rotation,
    lean,
    underprintOpacity,
    overprintOpacity,
    registrationX,
    registrationY,
    flip,
    headTilt,
    headDy,
    shoulderWidth,
    build,
    sleeve,
    pattern,
    stripeCount,
  };
};

interface Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

const multiplyMatrix = (m: Matrix2D, n: Matrix2D): Matrix2D => ({
  a: m.a * n.a + m.c * n.b,
  b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d,
  d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e,
  f: m.b * n.e + m.d * n.f + m.f,
});

const translateMatrix = (x: number, y: number): Matrix2D => ({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: x,
  f: y,
});

const scaleMatrix = (x: number, y: number): Matrix2D => ({
  a: x,
  b: 0,
  c: 0,
  d: y,
  e: 0,
  f: 0,
});

const rotateMatrix = (deg: number): Matrix2D => {
  const rad = (deg * Math.PI) / 180;
  return {
    a: Math.cos(rad),
    b: Math.sin(rad),
    c: -Math.sin(rad),
    d: Math.cos(rad),
    e: 0,
    f: 0,
  };
};

const skewXMatrix = (deg: number): Matrix2D => ({
  a: 1,
  b: 0,
  c: Math.tan((deg * Math.PI) / 180),
  d: 1,
  e: 0,
  f: 0,
});

const applyMatrix = (m: Matrix2D, x: number, y: number): [number, number] => [
  m.a * x + m.c * y + m.e,
  m.b * x + m.d * y + m.f,
];

/**
 * The base `<g>` transform shared by both print passes. `<JerseyIllustration>`
 * renders this matrix directly (`matrix(a b c d e f)`) rather than
 * re-encoding the same translate/rotate/skewX/scale chain as a template
 * string — one encoding, so the two can never drift apart.
 */
export const buildBaseTransformMatrix = (
  variant: PlayerFigureVariant,
): Matrix2D => {
  return [
    translateMatrix(
      110 + variant.offsetX,
      150 + variant.offsetY + variant.drop,
    ),
    rotateMatrix(variant.rotation),
    skewXMatrix(variant.lean),
    scaleMatrix(variant.flip * variant.scale, variant.scale),
    translateMatrix(-110, -150),
  ].reduce(multiplyMatrix);
};

/**
 * The figure's axis-aligned bounding box, computed analytically from the
 * composed matrix — no DOM measurement. The widest drawn element is the
 * torso (`JERSEY_TORSO_HALF_WIDTH`) or the arms (`JERSEY_ARM_REACH_HALF_WIDTH`),
 * each carried through `build` and `shoulderWidth` — with `build ≥ 0.86`,
 * `JERSEY_TORSO_HALF_WIDTH * build` is always ≥ 68.8, so the head
 * (`JERSEY_HEAD_ELLIPSE.rx`, 44) never wins that comparison and is not a
 * candidate here. The head top (`cy + headDy − ry`) still bounds the box
 * separately — the guard's top clearance is about the head, not the torso.
 *
 * The rendered figure is two passes: the underprint at the base transform,
 * and the overprint shifted from it by `(registrationX, registrationY)` in
 * these same viewBox units (see `JerseyIllustration.tsx`). The box below is
 * the union of both — bounding only the underprint would let the guard
 * certify a box the overprint's registration draw can still poke outside.
 */
export const computeFigureBoundingBox = (
  variant: PlayerFigureVariant,
): FigureBoundingBox => {
  const base = buildBaseTransformMatrix(variant);
  const halfWidth =
    Math.max(
      JERSEY_TORSO_HALF_WIDTH * variant.build,
      JERSEY_ARM_REACH_HALF_WIDTH * variant.build * variant.shoulderWidth,
    ) + STROKE_ALLOWANCE;
  const top =
    JERSEY_HEAD_ELLIPSE.cy +
    variant.headDy -
    JERSEY_HEAD_ELLIPSE.ry -
    STROKE_ALLOWANCE;
  const bottom = FIGURE_VIEWBOX_HEIGHT + STROKE_ALLOWANCE;

  const corners: [number, number][] = [
    [110 - halfWidth, top],
    [110 + halfWidth, top],
    [110 - halfWidth, bottom],
    [110 + halfWidth, bottom],
  ].map(([x, y]) => applyMatrix(base, x, y));

  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const underprint = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };

  // The overprint pass is the identical geometry, translated by the
  // registration offset — a uniform shift, so the union is cheap to derive
  // from the underprint box rather than re-running `applyMatrix`.
  return {
    minX: Math.min(underprint.minX, underprint.minX + variant.registrationX),
    maxX: Math.max(underprint.maxX, underprint.maxX + variant.registrationX),
    minY: Math.min(underprint.minY, underprint.minY + variant.registrationY),
    maxY: Math.max(underprint.maxY, underprint.maxY + variant.registrationY),
  };
};

/**
 * The top/side guard (#2542's addendum): shift before shrinking, at most 8
 * passes. Shrinks to fit only when the box is wider than the viewBox less
 * the margin; otherwise shifts horizontally so no shoulder crosses the
 * margin, and shifts down so the head top clears it. The bottom is
 * deliberately left free — a torso running past it is the crop lever
 * working, not a fault.
 */
export const applyContainmentGuard = (
  variant: PlayerFigureVariant,
): PlayerFigureVariant => {
  const maxWidth = FIGURE_VIEWBOX_WIDTH - 2 * CONTAINMENT_MARGIN;

  // One recursion step per pass, capped at MAX_CONTAINMENT_PASSES.
  const pass = (
    working: PlayerFigureVariant,
    n: number,
  ): PlayerFigureVariant => {
    if (n >= MAX_CONTAINMENT_PASSES) return working;
    const box = computeFigureBoundingBox(working);
    const width = box.maxX - box.minX;

    if (width > maxWidth + 0.5) {
      return pass(
        { ...working, scale: working.scale * (maxWidth / width) },
        n + 1,
      );
    }

    const dx = horizontalShift(box);
    const dy =
      box.minY < CONTAINMENT_MARGIN ? CONTAINMENT_MARGIN - box.minY : 0;

    if (Math.abs(dx) < SNAP_EPSILON && dy < SNAP_EPSILON) return working;

    return pass(
      {
        ...working,
        offsetX: working.offsetX + dx,
        drop: working.drop + dy,
      },
      n + 1,
    );
  };

  return pass(variant, 0);
};

/** How far to shift right (negative: left) so no shoulder crosses the margin. */
const horizontalShift = (box: { minX: number; maxX: number }): number => {
  if (box.minX < CONTAINMENT_MARGIN) return CONTAINMENT_MARGIN - box.minX;
  if (box.maxX > FIGURE_VIEWBOX_WIDTH - CONTAINMENT_MARGIN) {
    return FIGURE_VIEWBOX_WIDTH - CONTAINMENT_MARGIN - box.maxX;
  }
  return 0;
};

/**
 * The bottom clamp (#2590's correction): after the guard above settles, if
 * the torso stops short of the viewBox bottom, shift down to meet it.
 * Shifting down can never push the head back out of frame, so this never
 * re-triggers the top guard — it runs once, un-looped. A torso already
 * bleeding past the bottom is left untouched.
 */
export const applyBottomClamp = (
  variant: PlayerFigureVariant,
): PlayerFigureVariant => {
  const box = computeFigureBoundingBox(variant);
  if (box.maxY < FIGURE_VIEWBOX_HEIGHT) {
    return {
      ...variant,
      drop: variant.drop + (FIGURE_VIEWBOX_HEIGHT - box.maxY),
    };
  }
  return variant;
};

/**
 * The full pipeline: seed (see `playerFigureSeed`), draw the levers, then
 * guard and clamp. This is what `<JerseyIllustration>` calls — it never
 * needs the intermediate steps.
 */
export const computePlayerFigureVariant = (
  seed: string,
): PlayerFigureVariant => {
  const raw = generateRawPlayerFigureVariant(djb2Seed(seed));
  return applyBottomClamp(applyContainmentGuard(raw));
};
