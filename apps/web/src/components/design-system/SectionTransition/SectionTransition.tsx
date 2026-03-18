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

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "kcvv-black": "bg-kcvv-black",
  "kcvv-green-dark": "bg-kcvv-green-dark",
  transparent: "bg-transparent",
};

// Actual color values used in box-shadow seam fill. box-shadow paints outside
// the element's bounds (unaffected by parent overflow:visible) and fills any
// gap between the transition and its adjacent sections regardless of layout.
const BG_SHADOW_COLOR: Record<SectionBg, string> = {
  white: "#ffffff",
  "gray-100": "#f3f4f6",
  "kcvv-black": "var(--color-kcvv-black)",
  "kcvv-green-dark": "var(--color-kcvv-green-dark)",
  transparent: "transparent",
};

// TO color fills the lower triangle — FROM shows through the wrapper background.
const CLIP_PATH_TO: Record<"left" | "right", string> = {
  left: "polygon(100% 0, 100% 100%, 0 100%)", // lower-right — diagonal ↙
  right: "polygon(0 0, 0 100%, 100% 100%)", //  lower-left  — diagonal ↘
};

// FROM color fills the upper triangle — only needed for the double-diagonal
// inner halves where the wrapper is FROM but the first inner div background
// must be explicitly FROM as well.
const CLIP_PATH_FROM: Record<"left" | "right", string> = {
  left: "polygon(0 0, 100% 0, 0 100%)", // upper-left
  right: "polygon(0 0, 100% 0, 100% 100%)", // upper-right
};

const DIAGONAL_HEIGHT = "clamp(2rem, 6vw, 5rem)";
const DIAGONAL_HALF = "clamp(1rem, 3vw, 2.5rem)";

// 2px overlap on every seam edge — eliminates rendering gaps at the top and
// bottom boundaries of the transition element in all variants, zoom levels,
// and device pixel ratios (covers fractional-pixel heights from clamp()).
const SEAM = "2px";

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

  // Always overlap 1px at the top into the preceding section (same FROM color,
  // invisible) to close the top seam. For non-zero overlap modes the larger
  // negative margin already subsumes this 1px.
  let marginTop = `-${SEAM}`;
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

  const style: React.CSSProperties = {
    height,
    marginTop,
    // Pull the following section up to overlap this element's bottom.
    marginBottom: `-${SEAM}`,
    // box-shadow paints the correct colors above and below this element,
    // filling any remaining gap that layout-based overlap misses. Shadows are
    // not clipped by parent elements (none of our wrappers use overflow:hidden)
    // so they reach into any canvas-visible gap between block boundaries.
    // In overlap mode the top seam must be transparent — the from-section
    // content shows through rather than being hidden behind a solid shadow.
    boxShadow: `0 -${SEAM} 0 0 ${overlap !== "none" ? "transparent" : BG_SHADOW_COLOR[from]}, 0 ${SEAM} 0 0 ${BG_SHADOW_COLOR[to]}`,
  };
  if (zIndex) style.zIndex = zIndex;

  if (isDouble) {
    const opposite: "left" | "right" = direction === "left" ? "right" : "left";
    const midColor = via ?? to;
    // When overlapping into the previous section the FROM areas must be
    // transparent — the section content (e.g. carousel) shows through, and
    // only the via/to shapes are painted on top.
    const fromBg =
      overlap !== "none" ? BG_CLASS["transparent"] : BG_CLASS[from];
    return (
      <div
        aria-hidden="true"
        data-height={height}
        data-margin-top={marginTop}
        // Transparent in overlap mode so the preceding section shows through.
        // FROM color in non-overlap mode to continue the section boundary.
        className={cn("relative w-full overflow-hidden", fromBg, className)}
        style={style}
      >
        {/* First diagonal: from → via */}
        <div
          data-testid="st-sub"
          className="relative w-full"
          style={{ height: DIAGONAL_HEIGHT }}
        >
          <div
            className={cn("absolute inset-0", fromBg)}
            style={{ clipPath: CLIP_PATH_FROM[direction] }}
          />
          <div
            data-testid="st-sub-overlay"
            className={cn("absolute inset-0", BG_CLASS[midColor])}
            style={{ clipPath: CLIP_PATH_TO[direction] }}
          />
        </div>
        {/* Second diagonal: via → to (opposite direction).
            Extra 1px height + -1px marginTop closes the mid-seam between the
            two inner halves. overflow:hidden on the wrapper clips any excess. */}
        <div
          data-testid="st-sub"
          className="relative w-full"
          style={{
            height: `calc(${DIAGONAL_HEIGHT} + ${SEAM})`,
            marginTop: `-${SEAM}`,
          }}
        >
          <div
            className={cn("absolute inset-0", BG_CLASS[midColor])}
            style={{ clipPath: CLIP_PATH_FROM[opposite] }}
          />
          <div
            data-testid="st-sub-overlay"
            className={cn("absolute inset-0", BG_CLASS[to])}
            style={{ clipPath: CLIP_PATH_TO[opposite] }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      data-height={height}
      data-margin-top={marginTop}
      // FROM color as wrapper background — top boundary continues the preceding
      // FROM section seamlessly (both the 1px overlap and the upper triangle
      // share the same color, so the seam is invisible).
      className={cn("relative w-full", BG_CLASS[from], className)}
      style={style}
    >
      <div
        data-testid="st-overlay"
        className={cn("absolute inset-0", BG_CLASS[to])}
        style={{ clipPath: CLIP_PATH_TO[direction] }}
      />
    </div>
  );
}
