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
const BG_COLOR: Record<SectionBg, string> = {
  white: "#ffffff",
  "gray-100": "#f3f4f6",
  "kcvv-black": "var(--color-kcvv-black)",
  "kcvv-green-dark": "var(--color-kcvv-green-dark)",
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
  const height = isDouble ? `calc(2 * ${DIAGONAL_HEIGHT})` : DIAGONAL_HEIGHT;

  let marginTop = "0";
  let zIndex = "";

  if (overlap === "half") {
    marginTop = isDouble
      ? `calc(-1 * ${DIAGONAL_HEIGHT})`
      : `calc(-1 * ${DIAGONAL_HALF})`;
    zIndex = "10";
  } else if (overlap === "full") {
    marginTop = `calc(-1 * ${DIAGONAL_HEIGHT})`;
    zIndex = "10";
  }

  const style: React.CSSProperties = { height, marginTop };
  if (zIndex) style.zIndex = zIndex;

  if (isDouble) {
    const opposite: "left" | "right" = direction === "left" ? "right" : "left";
    const midColor = via ?? to;
    const fromFill = overlap !== "none" ? "transparent" : BG_COLOR[from];
    return (
      <div
        aria-hidden="true"
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

  const fromFill = overlap !== "none" ? "transparent" : BG_COLOR[from];

  return (
    <div
      aria-hidden="true"
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
