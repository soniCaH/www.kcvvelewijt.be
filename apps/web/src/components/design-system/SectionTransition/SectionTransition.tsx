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

const CLIP_PATH: Record<"left" | "right", string> = {
  left: "polygon(100% 0, 100% 100%, 0 100%)",
  right: "polygon(0 0, 0 100%, 100% 100%)",
};

const DIAGONAL_HEIGHT = "clamp(2rem, 6vw, 5rem)";
const DIAGONAL_HALF = "clamp(1rem, 3vw, 2.5rem)";

function SingleDiagonal({
  from,
  to,
  direction,
  testId = "st-sub",
}: {
  from: SectionBg;
  to: SectionBg;
  direction: "left" | "right";
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn("relative w-full flex-1", BG_CLASS[from])}
    >
      <div
        data-testid={`${testId}-overlay`}
        className={cn("absolute inset-0", BG_CLASS[to])}
        style={{ clipPath: CLIP_PATH[direction] }}
      />
    </div>
  );
}

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
        className={cn("relative w-full flex flex-col", className)}
        style={style}
      >
        <SingleDiagonal
          from={from}
          to={midColor}
          direction={direction}
          testId="st-sub"
        />
        <SingleDiagonal
          from={midColor}
          to={to}
          direction={opposite}
          testId="st-sub"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      data-height={height}
      data-margin-top={marginTop || undefined}
      data-z-index={zIndex || undefined}
      className={cn("relative w-full", BG_CLASS[from], className)}
      style={style}
    >
      <div
        data-testid="st-overlay"
        className={cn("absolute inset-0", BG_CLASS[to])}
        style={{ clipPath: CLIP_PATH[direction] }}
      />
    </div>
  );
}
