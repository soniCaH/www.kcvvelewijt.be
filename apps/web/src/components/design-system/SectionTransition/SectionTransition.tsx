import {
  StripedSeam,
  STRIPED_SEAM_HEIGHT_PX,
  type StripedSeamColorPair,
  type StripedSeamDirection,
  type StripedSeamHeight,
} from "@/components/design-system/StripedSeam";
import { cn } from "@/lib/utils/cn";

export type SectionBg =
  | "white"
  | "gray-100"
  | "kcvv-black"
  | "kcvv-green-dark"
  | "transparent";
export type TransitionOverlap = "none" | "half" | "full";

export type SectionTransitionConfig =
  | {
      type: "diagonal";
      direction: "left" | "right";
      overlap?: TransitionOverlap;
    }
  | {
      type: "double-diagonal";
      direction: "left" | "right";
      via: SectionBg;
      overlap?: TransitionOverlap;
    }
  | {
      type: "striped-seam";
      height: StripedSeamHeight;
      colorPair: StripedSeamColorPair;
      /** Defaults to `"horizontal"` — vertical is reserved for column seams. */
      direction?: StripedSeamDirection;
    };

/**
 * Component-level props. Intentionally flat (vs the discriminated
 * `SectionTransitionConfig` consumers pass to `SectionStack`) so
 * Storybook's `args` literal-inference quirk doesn't widen each story
 * into a `never` branch. SectionStack already discriminates at the
 * config boundary; this surface just renders.
 */
export interface SectionTransitionProps {
  from: SectionBg;
  to: SectionBg;
  type: "diagonal" | "double-diagonal" | "striped-seam";
  /**
   * `"left" | "right"` for the diagonal variants;
   * `"horizontal" | "vertical"` for `striped-seam`. Mixing values
   * across variants is silently ignored at render time.
   */
  direction?: "left" | "right" | StripedSeamDirection;
  via?: SectionBg;
  overlap?: TransitionOverlap;
  /** Striped-seam — forwarded to `<StripedSeam>`. */
  height?: StripedSeamHeight;
  /** Striped-seam — forwarded to `<StripedSeam>`. */
  colorPair?: StripedSeamColorPair;
  /**
   * Make the FROM half transparent so the previous section's backdrop
   * shows through. Auto-set by `SectionStack` when the FROM section has
   * a backdrop. Do not set manually. Typed `true | undefined` so
   * consumers can't opt out of the auto-propagation contract (PRD §3.2,
   * §8). For `striped-seam` the wrapper is already transparent so the
   * flag is a no-op there — kept for prop-shape parity.
   */
  revealFrom?: true;
  /**
   * Make the TO half transparent so the next section's backdrop shows
   * through. See `revealFrom`.
   */
  revealTo?: true;
  className?: string;
}

// CSS color values for SVG polygon fills.
// NOTE: Use resolved hex values, not CSS custom properties — SVG fill rendering
// uses a different pipeline from CSS background-color, and CSS variables in SVG
// attributes can produce sub-pixel color mismatches visible as a 1px seam line.
export const BG_COLOR: Record<SectionBg, string> = {
  white: "#ffffff",
  "gray-100": "#f3f4f6",
  "kcvv-black": "#1E2024",
  "kcvv-green-dark": "#008755",
  transparent: "transparent",
};

// Tailwind class counterpart of BG_COLOR — shared by `SectionStack` and
// `FooterSafeArea` so new `SectionBg` values only need to be added here.
export const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "kcvv-black": "bg-kcvv-black",
  "kcvv-green-dark": "bg-kcvv-green-dark",
  transparent: "bg-transparent",
};

// SVG polygon points — exact same corners as the old clip-path polygons,
// but rendered via SVG with shape-rendering="crispEdges" to eliminate
// the anti-aliasing fringe that clip-path produces.
// viewBox="0 0 100 100" + preserveAspectRatio="none" stretches to any aspect ratio.

// TO color fills the lower triangle — FROM fills the upper triangle.
const SVG_TO: Record<"left" | "right", string> = {
  left: "100,0 100,100 0,100", // lower-right — diagonal ↙
  right: "0,0 0,100 100,100", //  lower-left  — diagonal ↘
};

// FROM color fills the upper triangle — needed for double-diagonal inner halves.
const SVG_FROM: Record<"left" | "right", string> = {
  left: "0,0 100,0 0,100", // upper-left
  right: "0,0 100,0 100,100", // upper-right
};

/** Shift SVG polygon points vertically by `dy` (for double-diagonal lower half). */
function shiftY(points: string, dy: number): string {
  return points
    .split(" ")
    .map((p) => {
      const [x, y] = p.split(",");
      return `${x},${Number(y) + dy}`;
    })
    .join(" ");
}

// DIAGONAL_HEIGHT is sourced from the `--footer-diagonal` custom property
// in globals.css — the single source of truth consumed by this component,
// by `SectionStack`'s `reserveFooterSafeArea` behavior (last-section bg
// extension), and by the `FooterSafeArea` primitive. The browser resolves
// the var at render time inside inline styles and `calc()` strings, so the
// exported constant composes cleanly wherever the numeric value is used.
// `DIAGONAL_HALF` is a local-only token used by `overlap="half"` and does
// not currently have a global CSS counterpart.
export const DIAGONAL_HEIGHT = "var(--footer-diagonal)";
const DIAGONAL_HALF = "clamp(1rem, 3vw, 2.5rem)";

/**
 * Resolve the transition's vertical bleed distance to a CSS length so
 * `<SectionStack>` can extend a neighbour-section's backdrop into the
 * transition area by the right amount. Diagonal / double-diagonal share
 * `--footer-diagonal`; striped-seam varies per `height` token.
 */
export function getTransitionBleed(config: SectionTransitionConfig): string {
  if (config.type === "striped-seam") {
    return `${STRIPED_SEAM_HEIGHT_PX[config.height]}px`;
  }
  return DIAGONAL_HEIGHT;
}

export function SectionTransition({
  from,
  to,
  type,
  direction,
  via,
  overlap = "none",
  height,
  colorPair,
  revealFrom,
  revealTo,
  className,
}: SectionTransitionProps) {
  // `<StripedSeam>` already ships as transparent SVG — backdrop bleed
  // happens naturally without the polygon-fill / wrapper-bg juggling
  // the diagonal branch needs. `revealFrom` / `revealTo` are accepted
  // for prop-shape parity with the diagonal path but render as no-ops.
  if (type === "striped-seam") {
    // Equality narrow instead of a cast — keeps the runtime guarantee
    // even when a caller mistakenly passes "left" / "right" into a
    // striped-seam variant (config-boundary type safety lives on
    // `SectionTransitionConfig`, but the flat `Props` allows the mix).
    const seamDirection: StripedSeamDirection =
      direction === "vertical" ? "vertical" : "horizontal";
    const isVertical = seamDirection === "vertical";
    return (
      <div
        aria-hidden="true"
        data-testid="section-transition"
        data-type="striped-seam"
        className={cn(
          "pointer-events-none relative",
          // Width/height stretch + sub-pixel pull depends on orientation:
          //   - horizontal seam stretches across the row and pulls 1px
          //     into the next section to swallow sub-pixel gaps (same
          //     idea as the diagonal variant's `marginBottom: -1px`).
          //   - vertical seam stretches down the column instead.
          isVertical ? "-mr-px h-full" : "-mb-px w-full",
          className,
        )}
      >
        <StripedSeam
          height={height ?? "md"}
          colorPair={colorPair ?? "ink-cream"}
          direction={seamDirection}
        />
      </div>
    );
  }

  // Diagonal / double-diagonal branch. `direction` has been
  // pre-discriminated to the `"left" | "right"` half of the union by
  // the `type` check above; we narrow at the use site rather than
  // splitting into a sub-component.
  const diagonalDirection = direction === "right" ? "right" : "left";
  const isDouble = type === "double-diagonal";
  const isOverlap = overlap !== "none";
  const isRevealing = Boolean(revealFrom || revealTo);

  // For overlap cases, extend height and marginTop by 1px so the SVG bleeds 1px
  // into the previous section. This covers the sub-pixel gap that appears at the
  // SVG's top edge where the section boundary is (visible as a horizontal line on
  // the left side of the page, where the TO color polygon starts at the very top
  // of the SVG). The extra pixel is invisible: it paints the FROM color into the
  // section's own background area.
  let wrapperHeight = isDouble
    ? `calc(2 * ${DIAGONAL_HEIGHT})`
    : DIAGONAL_HEIGHT;
  let marginTop = "0";
  // §5.1 — z-index discipline. Non-overlap transitions now need z-index: 1 so
  // that a neighbor section's backdrop (absolutely positioned with negative
  // top/bottom) cannot paint above the opaque triangle. Overlap transitions
  // keep z-index: 10 per existing behavior.
  let zIndex = "1";

  if (overlap === "half") {
    marginTop = isDouble
      ? `calc(-1 * ${DIAGONAL_HEIGHT} - 1px)`
      : `calc(-1 * ${DIAGONAL_HALF} - 1px)`;
    wrapperHeight = isDouble
      ? `calc(2 * ${DIAGONAL_HEIGHT} + 1px)`
      : `calc(${DIAGONAL_HEIGHT} + 1px)`;
    zIndex = "10";
  } else if (overlap === "full") {
    marginTop = `calc(-1 * ${DIAGONAL_HEIGHT} - 1px)`;
    wrapperHeight = isDouble
      ? `calc(2 * ${DIAGONAL_HEIGHT} + 1px)`
      : `calc(${DIAGONAL_HEIGHT} + 1px)`;
    zIndex = "10";
  }

  // Wrapper background strategy (§5.2 — binary rule):
  //
  // The SVG is composited over the wrapper div background. Transparent pixels in
  // the SVG reveal the wrapper background — so the background doubles as a seam
  // guard for non-reveal cases.
  //
  //   1. Reveal mode (any reveal flag truthy) → transparent. If the wrapper were
  //      painted in BG_COLOR[to], the to-color would leak through a transparent
  //      FROM triangle where the neighbor's backdrop should show — wrong.
  //   2. Overlap + no reveal → step gradient (transparent at top, BG_COLOR[to]
  //      at 98%) preserves the existing hero-reveal behavior and seals the
  //      bottom edge.
  //   3. Otherwise → solid BG_COLOR[to]. The opaque FROM polygon hides it in
  //      the FROM area; the TO color seals sub-pixel gaps at the SVG bottom.
  let background: string;
  if (isRevealing) {
    background = "transparent";
  } else if (isOverlap) {
    background = `linear-gradient(to bottom, transparent 98%, ${BG_COLOR[to]} 98%)`;
  } else {
    background = BG_COLOR[to];
  }

  const style: React.CSSProperties = {
    height: wrapperHeight,
    marginTop,
    marginBottom: "-1px",
    background,
    zIndex,
  };

  // §5.3 — reveal-fill composition for the outer (from/to) polygons.
  //
  // FROM triangle:
  //   revealFrom → transparent (backdrop reveal, auto-propagated by SectionStack)
  //   isOverlap  → transparent (existing overlap behavior — hero / sponsor header
  //                shows through the upper triangle)
  //   otherwise  → BG_COLOR[from]
  //
  // TO triangle:
  //   revealTo → transparent
  //   otherwise → BG_COLOR[to]
  //
  // Reveal flags override the fill on their side only — they never cross
  // triangles. In double-diagonal, the `via` (mid) polygons are always opaque
  // (§5.4 — via is a color transition layer, not a reveal surface). `revealFrom`
  // and `revealTo` are typed `true | undefined`, so a truthy check is
  // sufficient — there is no `false` escape hatch.
  const fromFill = revealFrom || isOverlap ? "transparent" : BG_COLOR[from];
  const toFill = revealTo ? "transparent" : BG_COLOR[to];

  if (isDouble) {
    const opposite: "left" | "right" =
      diagonalDirection === "left" ? "right" : "left";
    const midColor = via ?? to;
    return (
      <div
        aria-hidden="true"
        data-testid="section-transition"
        data-height={wrapperHeight}
        data-margin-top={marginTop}
        className={cn("pointer-events-none relative w-full", className)}
        style={style}
      >
        {/* Single SVG spans both halves — no mid-seam gap possible. */}
        <svg
          viewBox="0 0 100 200"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {/* Upper half (y 0–100): from → via. §5.4 — revealFrom affects the
              upper FROM polygon only; the via polygon stays opaque. */}
          <polygon
            data-testid="st-upper-from"
            points={SVG_FROM[diagonalDirection]}
            fill={fromFill}
            shapeRendering="crispEdges"
          />
          <polygon
            data-testid="st-upper-to"
            points={SVG_TO[diagonalDirection]}
            fill={BG_COLOR[midColor]}
            shapeRendering="crispEdges"
          />
          {/* Lower half (y 100–200): via → to (opposite direction). §5.4 —
              revealTo affects the lower TO polygon only; via stays opaque. */}
          <polygon
            data-testid="st-lower-from"
            points={shiftY(SVG_FROM[opposite], 100)}
            fill={BG_COLOR[midColor]}
            shapeRendering="crispEdges"
          />
          <polygon
            data-testid="st-lower-to"
            points={shiftY(SVG_TO[opposite], 100)}
            fill={toFill}
            shapeRendering="crispEdges"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      data-testid="section-transition"
      data-height={wrapperHeight}
      data-margin-top={marginTop}
      className={cn("pointer-events-none relative w-full", className)}
      style={style}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <polygon
          data-testid="st-from"
          points={SVG_FROM[diagonalDirection]}
          fill={fromFill}
          shapeRendering="crispEdges"
        />
        <polygon
          data-testid="st-to"
          points={SVG_TO[diagonalDirection]}
          fill={toFill}
          shapeRendering="crispEdges"
        />
      </svg>
    </div>
  );
}
