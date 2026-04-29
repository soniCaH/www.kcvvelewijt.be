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

const FIRST_LETTER_TONE_CLASS: Record<DropCapParagraphTone, string> = {
  jersey: "first-letter:text-jersey-deep",
  ink: "first-letter:text-ink",
};

// Drop-cap rendered via the W3C `initial-letter` CSS property — purpose-built
// for drop caps and handles geometry against the actual rendered glyph
// metrics (cap-height, ascender, descender) so the cap sits flush with N
// body-line heights and the cap-line aligns with the body's first-line
// cap-line. Browser support: Chrome 110+, Safari (incl. -webkit- prefix for
// older), Firefox 132+. Falls back to a regular oversized first letter on
// older browsers — graceful degradation rather than wrong geometry.
//
// The first character stays in the DOM as normal text so screen readers
// pronounce it correctly without the aria-hidden + sr-only duplicate that
// the float-based approach required.
export function DropCapParagraph({
  children,
  as = "p",
  tone = "jersey",
  className,
}: DropCapParagraphProps) {
  if (!children || children.trim().length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[DropCapParagraph] received empty or whitespace-only children",
      );
    }
    return null;
  }

  return createElement(
    as,
    {
      "data-tone": tone,
      className: cn(
        "text-body-md leading-[1.6]",
        // initial-letter: <number-of-lines>. Both prefixed (older Safari)
        // and unprefixed declarations via Tailwind arbitrary properties.
        "first-letter:[initial-letter:3]",
        "first-letter:[-webkit-initial-letter:3]",
        "first-letter:font-display-big first-letter:font-black",
        "first-letter:mr-3",
        FIRST_LETTER_TONE_CLASS[tone],
        className,
      ),
    },
    children,
  );
}
