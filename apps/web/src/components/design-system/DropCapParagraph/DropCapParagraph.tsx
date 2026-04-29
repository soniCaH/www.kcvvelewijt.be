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

  return createElement(
    as,
    {
      "data-tone": tone,
      className: cn("text-body-md leading-relaxed", className),
    },
    <>
      <span
        data-drop-cap="true"
        aria-hidden="true"
        className={cn(
          // Drop-cap sized to span ~3 body lines. text-[4.5rem] / leading 1
          // gives a 72-px tall cap that fits cleanly inside 3 × 1.6 lines of
          // body-md text. The negative top adjustment realigns the cap's
          // glyph top with the body's first-line cap-top so the wraparound
          // sits flush.
          "font-display-big float-left mr-3 text-[4.5rem] leading-[0.78] font-black",
          // -mt-1 pulls the optical top of the cap up so the body's first
          // line cap-line meets the drop-cap's cap-line.
          "-mt-1",
          TONE_CLASS[tone],
        )}
      >
        {first}
      </span>
      <span className="sr-only">{first}</span>
      {rest}
    </>,
  );
}
