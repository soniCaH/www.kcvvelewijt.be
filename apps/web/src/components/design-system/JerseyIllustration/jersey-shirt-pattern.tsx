/**
 * Shirt-pattern ink marks for `<JerseyIllustration>`'s overprint pass —
 * vertical bands (the club's striped senior kit), hoops, dots (the club's
 * dotted youth kit), or plain (no marks). Not invented garments: the club
 * really does run both kits (#2635).
 *
 * Geometry ported from the design drill that decided the vocabulary:
 * `docs/design/mockups/2590-non-cutout-photos/2590-1-niet-uitgeknipt.html`.
 * Bands reuse `jersey-illustration-geometry.ts`'s stripe sets; hoops and
 * dots are generated from fixed grid constants (deterministic, no
 * per-instance randomness lives here — the variant module already resolved
 * which pattern and stripe count to draw).
 */
import { JERSEY_STRIPE_PATHS_BY_COUNT } from "./jersey-illustration-geometry";
import type { ShirtPattern, StripeCount } from "./player-figure-variant";

const HOOP_ROW_Y_POSITIONS = [186, 212, 238, 264, 290] as const;
const HOOP_TAPER_PER_ROW = 0.14;
const HOOP_LEFT_X = 44;
const HOOP_RIGHT_X = 176;

const DOT_GRID = {
  startY: 180,
  endY: 300,
  stepY: 22,
  startX: 56,
  endX: 186,
  stepX: 22,
  radius: 2.4,
} as const;

/** `start, start + step, …` while below `end`. */
const stepRange = (start: number, end: number, step: number): number[] =>
  Array.from(
    { length: Math.max(0, Math.ceil((end - start) / step)) },
    (_, i) => start + i * step,
  );

function buildDotPositions(): { cx: number; cy: number }[] {
  return stepRange(DOT_GRID.startY, DOT_GRID.endY, DOT_GRID.stepY).flatMap(
    (y) => {
      const rowOffset = ((y / DOT_GRID.stepY) % 2) * (DOT_GRID.stepX / 2);
      return stepRange(DOT_GRID.startX, DOT_GRID.endX, DOT_GRID.stepX).map(
        (x) => ({ cx: x + rowOffset, cy: y }),
      );
    },
  );
}

// `DOT_GRID` is frozen and `buildDotPositions` takes no arguments, so the
// result is the same every render — compute it once at module load rather
// than on every draw of a dotted card.
const DOT_POSITIONS = buildDotPositions();

export interface ShirtPatternMarksProps {
  pattern: ShirtPattern;
  stripeCount: StripeCount;
  strokeWidth: number;
}

export function ShirtPatternMarks({
  pattern,
  stripeCount,
  strokeWidth,
}: ShirtPatternMarksProps) {
  if (pattern === "plain") return null;

  if (pattern === "bands") {
    return (
      <>
        {JERSEY_STRIPE_PATHS_BY_COUNT[stripeCount].map((d) => (
          <path key={d} d={d} strokeWidth={strokeWidth} />
        ))}
      </>
    );
  }

  if (pattern === "hoops") {
    return (
      <>
        {HOOP_ROW_Y_POSITIONS.map((y) => {
          const taper = (y - HOOP_ROW_Y_POSITIONS[0]) * HOOP_TAPER_PER_ROW;
          return (
            <path
              key={y}
              d={`M ${(HOOP_LEFT_X + taper).toFixed(2)} ${y} L ${(HOOP_RIGHT_X - taper).toFixed(2)} ${y}`}
              strokeWidth={strokeWidth}
            />
          );
        })}
      </>
    );
  }

  // dots — `fill`/`stroke` hoisted onto the wrapping `<g>` rather than
  // repeated on each of the (up to) 36 circles.
  return (
    <g fill="var(--color-ink)" stroke="none">
      {DOT_POSITIONS.map(({ cx, cy }) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={DOT_GRID.radius} />
      ))}
    </g>
  );
}
