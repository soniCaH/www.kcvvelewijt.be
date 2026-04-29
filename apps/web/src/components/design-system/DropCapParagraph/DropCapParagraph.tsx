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
          "font-display-big float-left mr-3 font-black",
          TONE_CLASS[tone],
        )}
        style={{
          // Sized to exactly span 3 body-md leading-relaxed lines
          // (3 × 1rem × 1.625 ≈ 4.875rem). line-height: 1 keeps surrounding
          // body line-heights at their natural relaxed value, and matching
          // the float's height to a multiple of body line-height makes the
          // float clear cleanly at the bottom so subsequent lines start
          // flush instead of colliding with the cap's bottom serifs.
          fontSize: "4.875rem",
          lineHeight: 1,
          // Pull the optical glyph top up so the cap's cap-line sits flush
          // with the body's first-line cap-line (caps render with a small
          // gap above them).
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
