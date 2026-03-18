import { cn } from "@/lib/utils/cn";

export type SectionBg = "white" | "gray-100" | "kcvv-black" | "kcvv-green-dark";
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
};

// FROM color fills the upper triangle (source side).
const CLIP_PATH_FROM: Record<"left" | "right", string> = {
  left: "polygon(0 0, 100% 0, 0 100%)", // upper-left  — diagonal ↘ left
  right: "polygon(0 0, 100% 0, 100% 100%)", // upper-right — diagonal ↙ right
};

// TO color fills the lower triangle (destination side) — perfect complement of FROM.
const CLIP_PATH_TO: Record<"left" | "right", string> = {
  left: "polygon(100% 0, 100% 100%, 0 100%)", // lower-right
  right: "polygon(0 0, 0 100%, 100% 100%)", // lower-left
};

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

  let marginTop = "";
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

  const style: React.CSSProperties = { height };
  if (marginTop) style.marginTop = marginTop;
  if (zIndex) style.zIndex = zIndex;

  if (isDouble) {
    const opposite: "left" | "right" = direction === "left" ? "right" : "left";
    const midColor = via ?? to;
    return (
      <div
        aria-hidden="true"
        data-height={height}
        data-margin-top={marginTop || undefined}
        data-z-index={zIndex || undefined}
        // No background color — transparent wrapper eliminates ghost-border artifacts
        // when this element overlaps an adjacent section.
        className={cn("relative w-full overflow-hidden", className)}
        style={style}
      >
        {/* Top half: from → via. Transparent sub-wrapper + two complementary clips. */}
        <div
          data-testid="st-sub"
          className="absolute left-0 right-0 top-0"
          style={{ height: "calc(50% + 1px)" }}
        >
          <div
            className={cn("absolute inset-0", BG_CLASS[from])}
            style={{ clipPath: CLIP_PATH_FROM[direction] }}
          />
          <div
            data-testid="st-sub-overlay"
            className={cn("absolute inset-0", BG_CLASS[midColor])}
            style={{ clipPath: CLIP_PATH_TO[direction] }}
          />
        </div>
        {/* Bottom half: via → to. */}
        <div
          data-testid="st-sub"
          className="absolute left-0 right-0 bottom-0"
          style={{ height: "calc(50% + 1px)" }}
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
      data-margin-top={marginTop || undefined}
      data-z-index={zIndex || undefined}
      // No background color — transparent wrapper eliminates ghost-border artifacts.
      className={cn("relative w-full", className)}
      style={style}
    >
      <div
        className={cn("absolute inset-0", BG_CLASS[from])}
        style={{ clipPath: CLIP_PATH_FROM[direction] }}
      />
      <div
        data-testid="st-overlay"
        className={cn("absolute inset-0", BG_CLASS[to])}
        style={{ clipPath: CLIP_PATH_TO[direction] }}
      />
    </div>
  );
}
