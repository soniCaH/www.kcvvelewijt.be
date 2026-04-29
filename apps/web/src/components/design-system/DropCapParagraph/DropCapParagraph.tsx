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
          // Drop-cap pattern: float:left + font-size sized to span 3 body
          // lines + line-height:1 + tight right margin. line-height: 1 keeps
          // the cap glyph inside its bounding box so surrounding body lines
          // wrap at their natural body line-height instead of being pushed
          // apart by a tall line-strut on the cap span.
          "font-display-big float-left mr-2 mb-1 text-[4rem] leading-none font-black",
          TONE_CLASS[tone],
        )}
        style={{
          // Pull the cap's optical top up by the body's natural cap-to-top
          // gap so the H aligns with the body's first-line cap line.
          marginTop: "-0.1em",
        }}
      >
        {first}
      </span>
      <span className="sr-only">{first}</span>
      {rest}
    </>,
  );
}
