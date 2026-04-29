import { createElement, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { HighlighterStroke } from "../HighlighterStroke";

export type EditorialHeadingSize =
  | "display-2xl"
  | "display-xl"
  | "display-lg"
  | "display-md"
  | "display-sm";

export type EditorialHeadingTone = "ink" | "jersey-deep" | "cream";

export type EditorialHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface EditorialHeadingEmphasis {
  text: string;
  /**
   * `true`  → italic + green HighlighterStroke (marker variant).
   * `false` (default) → italic + jersey-deep accent colour (accent variant).
   * The two variants are mutually exclusive — see PRD §4.1 / §11.
   */
  highlight?: boolean;
}

export interface EditorialHeadingProps {
  level: EditorialHeadingLevel;
  children: string;
  size?: EditorialHeadingSize;
  emphasis?: EditorialHeadingEmphasis;
  tone?: EditorialHeadingTone;
  className?: string;
}

const SIZE_CLASS: Record<EditorialHeadingSize, string> = {
  "display-2xl":
    "font-display-big text-[length:var(--text-display-2xl)] leading-[var(--text-display-2xl--lh)] font-black",
  "display-xl":
    "font-display text-[length:var(--text-display-xl)] leading-[var(--text-display-xl--lh)] font-bold",
  "display-lg":
    "font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--lh)] font-bold",
  "display-md":
    "font-display text-[length:var(--text-display-md)] leading-[var(--text-display-md--lh)] font-bold",
  "display-sm":
    "font-display text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] font-semibold",
};

const TONE_CLASS: Record<EditorialHeadingTone, string> = {
  ink: "text-ink",
  "jersey-deep": "text-jersey-deep",
  cream: "text-cream",
};

function ensureTrailingPeriod(text: string): string {
  return text.endsWith(".") ? text : `${text}.`;
}

function splitOnEmphasis(
  text: string,
  emphasisText: string,
): { before: string; match: string; after: string } | null {
  if (!emphasisText) return null;
  const idx = text.indexOf(emphasisText);
  if (idx < 0) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + emphasisText.length),
    after: text.slice(idx + emphasisText.length),
  };
}

export function EditorialHeading({
  level,
  children,
  size = "display-lg",
  emphasis,
  tone = "ink",
  className,
}: EditorialHeadingProps) {
  const display = ensureTrailingPeriod(children);

  let body: ReactNode = display;
  if (emphasis) {
    const split = splitOnEmphasis(display, emphasis.text);
    if (!split) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[EditorialHeading] emphasis.text "${emphasis.text}" not found in heading children "${display}"`,
        );
      }
    } else {
      // Two mutually-exclusive emphasis variants:
      // - highlight=true: italic + body tone, wrapped in <HighlighterStroke>
      //   (the "marker pass" treatment).
      // - highlight=false: italic + jersey-deep accent colour, no underline
      //   (the "colour accent" treatment from the design source).
      const isHighlight = !!emphasis.highlight;
      const emEl = (
        <em
          className={cn(
            "font-display italic",
            !isHighlight && "text-jersey-deep",
          )}
        >
          {split.match}
        </em>
      );
      const wrapped = isHighlight ? (
        <HighlighterStroke>{emEl}</HighlighterStroke>
      ) : (
        emEl
      );
      body = (
        <>
          {split.before}
          {wrapped}
          {split.after}
        </>
      );
    }
  }

  return createElement(
    `h${level}`,
    {
      "data-size": size,
      "data-tone": tone,
      className: cn(
        "tracking-tight",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      ),
    },
    body,
  );
}
