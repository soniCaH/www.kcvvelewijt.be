import { createElement } from "react";
import { cn } from "@/lib/utils/cn";

export type DropCapParagraphTone = "jersey" | "ink";
export type DropCapParagraphAs = "p" | "div";

export interface DropCapParagraphProps {
  children: string;
  as?: DropCapParagraphAs;
  tone?: DropCapParagraphTone;
  className?: string;
}

const TONE_CLASS: Record<DropCapParagraphTone, string> = {
  jersey: "text-jersey-deep",
  ink: "text-ink",
};

export function DropCapParagraph({
  children,
  as = "p",
  tone = "jersey",
  className,
}: DropCapParagraphProps) {
  if (!children) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[DropCapParagraph] received empty children");
    }
    return null;
  }

  const first = children.charAt(0);
  const rest = children.slice(1);

  // Body and drop-cap dimensions derived from the SAME source values so the
  // float's height is guaranteed to equal exactly N body line-heights —
  // independent of any class-resolution surprises (token vs preset, leading
  // class specificity, parent overrides). The parent paragraph and the cap
  // span both get inline-style font-size + line-height so nothing else can
  // win the cascade.
  const BODY_FONT_SIZE_REM = 1;
  const BODY_LINE_HEIGHT = 1.6;
  const DROP_CAP_LINES = 3;
  const dropCapFontSizeRem =
    BODY_FONT_SIZE_REM * BODY_LINE_HEIGHT * DROP_CAP_LINES;

  return createElement(
    as,
    {
      "data-tone": tone,
      className: cn(className),
      style: {
        fontSize: `${BODY_FONT_SIZE_REM}rem`,
        lineHeight: BODY_LINE_HEIGHT,
      },
    },
    <>
      <span
        data-drop-cap="true"
        aria-hidden="true"
        className={cn(
          "font-display-big float-left mt-0 mr-3 mb-0 font-black",
          TONE_CLASS[tone],
        )}
        style={{
          // Explicit height = N × body line-height. Without this, Freight Big
          // Pro's natural ascender + descender extend past 1em even when
          // line-height: 1 is set, which makes the float taller than the
          // visible glyph and pushes line N+1 down by the overflow amount.
          // display: block + fixed height + overflow: hidden clip the float
          // box to exactly N body lines so the wrap clears flush.
          display: "block",
          height: `${dropCapFontSizeRem}rem`,
          fontSize: `${dropCapFontSizeRem}rem`,
          lineHeight: 1,
          overflow: "visible",
        }}
      >
        {first}
      </span>
      <span className="sr-only">{first}</span>
      {rest}
    </>,
  );
}
