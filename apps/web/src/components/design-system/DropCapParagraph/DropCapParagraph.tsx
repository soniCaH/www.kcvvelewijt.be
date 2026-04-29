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
          "font-display-big float-left mt-1 mr-2 text-[length:var(--text-display-2xl)] leading-[0.85] font-black",
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
