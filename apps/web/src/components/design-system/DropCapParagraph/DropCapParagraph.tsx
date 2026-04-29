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

  // Body line-height locked to text-body-md's --lh token so the dropcap
  // height calculation below stays accurate even if the parent's class
  // changes between leading-relaxed (1.6) and another preset.
  const BODY_LINE_HEIGHT = 1.6;
  const BODY_FONT_SIZE_REM = 1; // text-body-md = 1rem
  const DROP_CAP_LINES = 3;
  const dropCapFontSize = `${BODY_FONT_SIZE_REM * BODY_LINE_HEIGHT * DROP_CAP_LINES}rem`;

  return createElement(
    as,
    {
      "data-tone": tone,
      className: cn("text-body-md leading-[1.6]", className),
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
          // Float height must equal exactly DROP_CAP_LINES × body line-height
          // so the float clears flush with the bottom of line N. Any non-zero
          // top/bottom margin or line-height ≠ 1 breaks the alignment.
          fontSize: dropCapFontSize,
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
