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

// CSS color values for linear-gradient backgrounds. Using actual color values
// (not Tailwind classes) because gradients require CSS color syntax.
const BG_COLOR: Record<SectionBg, string> = {
  white: "#ffffff",
  "gray-100": "#f3f4f6",
  "kcvv-black": "var(--color-kcvv-black)",
  "kcvv-green-dark": "var(--color-kcvv-green-dark)",
  transparent: "transparent",
};

const DIAGONAL_HEIGHT = "clamp(2rem, 6vw, 5rem)";
const DIAGONAL_HALF = "clamp(1rem, 3vw, 2.5rem)";

// Tiny blur zone (1px) around the 50% boundary to anti-alias the diagonal edge.
const STOP_BEFORE = "calc(50% - 0.5px)";
const STOP_AFTER = "calc(50% + 0.5px)";

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

  // In overlap mode, FROM areas are transparent so the section content
  // (e.g. carousel) shows through.
  const fromColor = overlap !== "none" ? "transparent" : BG_COLOR[from];

  if (isDouble) {
    const opposite: "left" | "right" = direction === "left" ? "right" : "left";
    const midColor = BG_COLOR[via ?? to];
    const wrapperStyle: React.CSSProperties = { height, marginTop };
    if (zIndex) wrapperStyle.zIndex = zIndex;

    return (
      <div
        aria-hidden="true"
        data-height={height}
        data-margin-top={marginTop}
        className={cn("w-full", className)}
        style={wrapperStyle}
      >
        {/* First diagonal: from → via */}
        <div
          data-testid="st-sub"
          style={{
            height: DIAGONAL_HEIGHT,
            background: `linear-gradient(to bottom ${direction}, ${fromColor} ${STOP_BEFORE}, ${midColor} ${STOP_AFTER})`,
          }}
        />
        {/* Second diagonal: via → to (opposite direction) */}
        <div
          data-testid="st-sub"
          style={{
            height: DIAGONAL_HEIGHT,
            background: `linear-gradient(to bottom ${opposite}, ${midColor} ${STOP_BEFORE}, ${BG_COLOR[to]} ${STOP_AFTER})`,
          }}
        />
      </div>
    );
  }

  const gradientStyle: React.CSSProperties = {
    height,
    marginTop,
    background: `linear-gradient(to bottom ${direction}, ${fromColor} ${STOP_BEFORE}, ${BG_COLOR[to]} ${STOP_AFTER})`,
  };
  if (zIndex) gradientStyle.zIndex = zIndex;

  return (
    <div
      aria-hidden="true"
      data-height={height}
      data-margin-top={marginTop}
      className={cn("w-full", className)}
      style={gradientStyle}
    />
  );
}
