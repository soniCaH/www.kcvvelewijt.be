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
          fontSize: `${dropCapFontSizeRem}rem`,
          lineHeight: 1,
        }}
      >
        {first}
      </span>
      <span className="sr-only">{first}</span>
      {rest}
    </>,
  );
}
