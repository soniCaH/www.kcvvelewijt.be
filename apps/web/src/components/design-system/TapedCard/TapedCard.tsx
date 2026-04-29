import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { TapeStrip, type TapeStripProps } from "../TapeStrip/TapeStrip";

export type TapedCardRotation =
  | "a"
  | "b"
  | "c"
  | "d"
  | "none"
  | "auto"
  | number;

export type TapedCardShadow = "sm" | "md" | "lift";
export type TapedCardBg = "cream" | "cream-soft" | "ink" | "jersey";
export type TapedCardPadding = "sm" | "md" | "lg" | "none";
export type TapedCardAs = "div" | "article" | "section" | "li" | "figure";

export interface TapedCardProps {
  rotation?: TapedCardRotation;
  tape?: TapeStripProps | TapeStripProps[];
  shadow?: TapedCardShadow;
  bg?: TapedCardBg;
  padding?: TapedCardPadding;
  interactive?: boolean;
  as?: TapedCardAs;
  className?: string;
  children: ReactNode;
}

const ROTATION_CSS: Record<Exclude<TapedCardRotation, number>, string> = {
  a: "var(--rotate-tape-a)",
  b: "var(--rotate-tape-b)",
  c: "var(--rotate-tape-c)",
  d: "var(--rotate-tape-d)",
  auto: "var(--taped-card-rotation, 0deg)",
  none: "0deg",
};

function rotationToCss(r: TapedCardRotation): string {
  if (typeof r === "number") return `${r}deg`;
  return ROTATION_CSS[r];
}

const SHADOW_CLASS: Record<TapedCardShadow, string> = {
  sm: "shadow-paper-sm",
  md: "shadow-paper-md",
  lift: "shadow-paper-lift",
};

const BG_CLASS: Record<TapedCardBg, string> = {
  cream: "bg-cream text-ink",
  "cream-soft": "bg-cream-soft text-ink",
  ink: "bg-ink text-cream",
  jersey: "bg-jersey text-ink",
};

const PADDING_CLASS: Record<TapedCardPadding, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
  none: "p-0",
};

type StyleWithVars = CSSProperties & Record<`--${string}`, string | number>;

export function TapedCard({
  rotation = "none",
  tape,
  shadow = "md",
  bg = "cream",
  padding = "md",
  interactive = false,
  as: Tag = "div",
  className,
  children,
}: TapedCardProps) {
  const restRotation = rotationToCss(rotation);
  const style: StyleWithVars = interactive
    ? {
        "--card-rest-rotation": restRotation,
        transform:
          "rotate(calc(var(--card-rest-rotation) + var(--card-hover-delta, 0deg)))",
      }
    : { transform: `rotate(${restRotation})` };

  const tapes = tape ? (Array.isArray(tape) ? tape : [tape]) : [];

  return (
    <Tag
      data-rotation={typeof rotation === "number" ? "custom" : rotation}
      data-bg={bg}
      data-shadow={shadow}
      data-padding={padding}
      data-interactive={interactive ? "true" : "false"}
      style={style}
      className={cn(
        "relative",
        // Solid ink border + hard offset shadow is the signature paper-card
        // look in the retro-terrace-fanzine direction. Border merges visually
        // into bg=ink cards but the shadow still defines the silhouette.
        "border-ink border-2",
        SHADOW_CLASS[shadow],
        BG_CLASS[bg],
        PADDING_CLASS[padding],
        interactive &&
          "motion-safe:hover:shadow-paper-lift transition-[transform,box-shadow] duration-300 motion-safe:hover:[--card-hover-delta:1deg]",
        className,
      )}
    >
      {tapes.map((tapeProps, index) => (
        <TapeStrip key={index} {...tapeProps} />
      ))}
      {children}
    </Tag>
  );
}
