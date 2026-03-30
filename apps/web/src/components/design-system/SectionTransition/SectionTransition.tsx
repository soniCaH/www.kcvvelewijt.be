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
    };

export interface SectionTransitionProps {
  from: SectionBg;
  to: SectionBg;
  type: "diagonal" | "double-diagonal";
  direction: "left" | "right";
  via?: SectionBg;
  overlap?: TransitionOverlap;
  className?: string;
}

// CSS color values for SVG polygon fills.
// NOTE: Use resolved hex values, not CSS custom properties — SVG fill rendering
// uses a different pipeline from CSS background-color, and CSS variables in SVG
// attributes can produce sub-pixel color mismatches visible as a 1px seam line.
const BG_COLOR: Record<SectionBg, string> = {
  white: "#ffffff",
  "gray-100": "#f3f4f6",
  "kcvv-black": "#1E2024",
  "kcvv-green-dark": "#008755",
  transparent: "transparent",
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

const DIAGONAL_HEIGHT = "clamp(2rem, 6vw, 5rem)";
const DIAGONAL_HALF = "clamp(1rem, 3vw, 2.5rem)";

export function SectionTransition({
  from,
  to,
  type,
  direction,
  via,
  overlap = "none",
  className,
}: SectionTransitionProps) {
  const isDouble = type === "double-diagonal";
  const isOverlap = overlap !== "none";

  // For overlap cases, extend height and marginTop by 1px so the SVG bleeds 1px
  // into the previous section. This covers the sub-pixel gap that appears at the
  // SVG's top edge where the section boundary is (visible as a horizontal line on
  // the left side of the page, where the TO color polygon starts at the very top
  // of the SVG). The extra pixel is invisible: it paints the FROM color into the
  // section's own background area.
  let height = isDouble ? `calc(2 * ${DIAGONAL_HEIGHT})` : DIAGONAL_HEIGHT;
  let marginTop = "0";
  let zIndex = "";

  if (overlap === "half") {
    marginTop = isDouble
      ? `calc(-1 * ${DIAGONAL_HEIGHT} - 1px)`
      : `calc(-1 * ${DIAGONAL_HALF} - 1px)`;
    height = isDouble
      ? `calc(2 * ${DIAGONAL_HEIGHT} + 1px)`
      : `calc(${DIAGONAL_HEIGHT} + 1px)`;
    zIndex = "10";
  } else if (overlap === "full") {
    marginTop = `calc(-1 * ${DIAGONAL_HEIGHT} - 1px)`;
    height = `calc(${DIAGONAL_HEIGHT} + 1px)`;
    zIndex = "10";
  }

  // Wrapper background strategy:
  //
  // The SVG is composited over the wrapper div background. Transparent pixels in
  // the SVG (including any 1-px fringe crispEdges leaves at polygon edges) reveal
  // the wrapper background — so the background doubles as a seam guard without
  // needing explicit <rect> elements that would bleed through the FROM area.
  //
  // Non-overlap: solid TO color. The opaque FROM polygon hides it in the FROM
  //   area; the TO color seals any sub-pixel gap at the SVG bottom where the
  //   page background (white) would otherwise show.
  //
  // Overlap: the FROM polygon is TRANSPARENT so the hero image shows through.
  //   A step gradient is transparent at the top (FROM area stays clear) and
  //   switches to TO color at 98% (seals the last ~2 px at the SVG bottom).
  const style: React.CSSProperties = {
    height,
    marginTop,
    marginBottom: "-1px",
    background: isOverlap
      ? `linear-gradient(to bottom, transparent 98%, ${BG_COLOR[to]} 98%)`
      : BG_COLOR[to],
  };
  if (zIndex) style.zIndex = zIndex;

  // For overlap transitions the FROM polygon must be transparent — the section
  // behind the transition (hero image, sponsor header, etc.) should be visible
  // through the upper-triangle area. For non-overlap transitions the FROM polygon
  // is painted explicitly so it doesn't depend on what happens to be behind it.
  const fromFill = isOverlap ? "transparent" : BG_COLOR[from];

  if (isDouble) {
    const opposite: "left" | "right" = direction === "left" ? "right" : "left";
    const midColor = via ?? to;
    return (
      <div
        aria-hidden="true"
        data-testid="section-transition"
        data-height={height}
        data-margin-top={marginTop}
        className={cn("relative w-full", className)}
        style={style}
      >
        {/* Single SVG spans both halves — no mid-seam gap possible. */}
        <svg
          viewBox="0 0 100 200"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {/* Upper half (y 0–100): from → via */}
          <polygon
            data-testid="st-upper-from"
            points={SVG_FROM[direction]}
            fill={fromFill}
            shapeRendering="crispEdges"
          />
          <polygon
            data-testid="st-upper-to"
            points={SVG_TO[direction]}
            fill={BG_COLOR[midColor]}
            shapeRendering="crispEdges"
          />
          {/* Lower half (y 100–200): via → to (opposite direction) */}
          <polygon
            data-testid="st-lower-from"
            points={shiftY(SVG_FROM[opposite], 100)}
            fill={BG_COLOR[midColor]}
            shapeRendering="crispEdges"
          />
          <polygon
            data-testid="st-lower-to"
            points={shiftY(SVG_TO[opposite], 100)}
            fill={BG_COLOR[to]}
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
      data-height={height}
      data-margin-top={marginTop}
      className={cn("relative w-full", className)}
      style={style}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <polygon
          data-testid="st-from"
          points={SVG_FROM[direction]}
          fill={fromFill}
          shapeRendering="crispEdges"
        />
        <polygon
          data-testid="st-to"
          points={SVG_TO[direction]}
          fill={BG_COLOR[to]}
          shapeRendering="crispEdges"
        />
      </svg>
    </div>
  );
}
