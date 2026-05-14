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

export type TapedCardShadow = "sm" | "md" | "lift" | "soft";
export type TapedCardBg =
  | "cream"
  | "cream-soft"
  | "ink"
  | "jersey"
  | "jersey-deep";
export type TapedCardPadding = "sm" | "md" | "lg" | "none";
export type TapedCardAs = "div" | "article" | "section" | "li" | "figure";

/**
 * `false` — no hover behaviour.
 * `true` / `"tilt"` — rotation delta on hover (the historical default).
 * `"press"` — canonical paper press-down: translate(1px, 1px) and shadow →
 *   none on hover. Composes with `rotation` (rotation is preserved on hover).
 *   Used by <TapedFigure interactive> for the layered photo-lift model
 *   locked in the R9 photo-treatment system.
 */
export type TapedCardInteractive = boolean | "tilt" | "press";

export interface TapedCardProps {
  rotation?: TapedCardRotation;
  tape?: TapeStripProps | TapeStripProps[];
  shadow?: TapedCardShadow;
  bg?: TapedCardBg;
  padding?: TapedCardPadding;
  interactive?: TapedCardInteractive;
  as?: TapedCardAs;
  className?: string;
  /** Extra `data-*` attributes forwarded onto the rendered root. Used by
   *  composers (e.g. <TapedFigure>) that need to expose state-bearing
   *  attributes to global CSS rules without bleeding their concerns into
   *  TapedCard's prop API. */
  dataAttrs?: Record<`data-${string}`, string>;
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
  // Soft sibling — uses ink-muted instead of pure ink for the offset.
  // Same rationale as the canonical button soft-shadow: black-on-black
  // ink-bg cards lose their silhouette without it.
  soft: "shadow-paper-sm-soft",
};

const BG_CLASS: Record<TapedCardBg, string> = {
  cream: "bg-cream text-ink",
  "cream-soft": "bg-cream-soft text-ink",
  ink: "bg-ink text-cream",
  jersey: "bg-jersey text-ink",
  "jersey-deep": "bg-jersey-deep text-cream",
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
  dataAttrs,
  children,
}: TapedCardProps) {
  const restRotation = rotationToCss(rotation);
  // Normalise `interactive: true` to the historical "tilt" idiom so the
  // boolean form keeps its existing meaning for current consumers.
  const interactiveMode: false | "tilt" | "press" =
    interactive === true ? "tilt" : interactive === false ? false : interactive;
  const isInteractive = interactiveMode !== false;
  const style: StyleWithVars = isInteractive
    ? {
        "--card-rest-rotation": restRotation,
        // Composes translate (press mode) + rotation (always) + tilt-delta
        // (tilt mode only — defaults to 0deg). Both `--card-press-{x,y}` and
        // `--card-hover-delta` default to 0, so a press-mode card only ever
        // translates and a tilt-mode card only ever rotates.
        transform:
          "translate(var(--card-press-x, 0px), var(--card-press-y, 0px)) " +
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
      data-interactive={interactiveMode === false ? "false" : interactiveMode}
      {...dataAttrs}
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
        interactiveMode === "tilt" &&
          "motion-safe:hover:shadow-paper-lift transition-[transform,box-shadow] duration-300 motion-safe:hover:[--card-hover-delta:1deg]",
        interactiveMode === "press" &&
          // Canonical paper press-down: card translates +1/+1 and the offset
          // shadow collapses to flush. Tape strips are children so they
          // translate with the card frame (R9 §7: "anchored to card frame").
          "transition-[transform,box-shadow] duration-300 motion-safe:hover:shadow-none motion-safe:hover:[--card-press-x:1px] motion-safe:hover:[--card-press-y:1px]",
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
