import { createElement, type ReactNode } from "react";
import type { PortableTextBlock } from "@portabletext/react";
import { cn } from "@/lib/utils/cn";

interface TitleSpan {
  _type?: "span";
  _key?: string;
  text?: string;
  marks?: string[];
}
import { HighlighterStroke } from "../HighlighterStroke";

export type EditorialHeadingSize =
  | "display-2xl"
  | "display-xl"
  | "display-lg"
  | "display-md"
  | "display-sm";

export type EditorialHeadingTone = "ink" | "jersey-deep" | "cream";

/**
 * Accent colour for the italic emphasis (string-emphasis path) or the
 * `accent`-marked spans (Portable Text path).
 *
 * - `jersey-deep` (default) — readable on cream / paper surfaces.
 * - `warm` — readable on jersey-deep / ink surfaces (`text-warm` token
 *   landed in #1697). Used by `<FeaturedEventBand>` and `<YouthBlock>`.
 */
export type EditorialHeadingAccentTone = "jersey-deep" | "warm";

export type EditorialHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface EditorialHeadingEmphasis {
  text: string;
  /**
   * `true`  → italic + green HighlighterStroke (marker variant).
   * `false` (default) → italic + accent colour (accent variant).
   * The two variants are mutually exclusive — see PRD §4.1 / §11.
   */
  highlight?: boolean;
  /**
   * Accent colour when NOT highlighting. Default `"jersey-deep"` preserves
   * the original behaviour. `"warm"` for dark surfaces. Ignored when
   * `highlight: true` (HighlighterStroke owns its own colour).
   */
  tone?: EditorialHeadingAccentTone;
}

export interface EditorialHeadingProps {
  level: EditorialHeadingLevel;
  /**
   * Plain string (legacy, with optional `emphasis` substring) OR a
   * single-block constrained Portable Text array (post Ask 9 — the
   * `accent` decorator on a span renders italic + accent colour).
   */
  children: string | PortableTextBlock[];
  size?: EditorialHeadingSize;
  emphasis?: EditorialHeadingEmphasis;
  tone?: EditorialHeadingTone;
  /**
   * Accent colour for `accent`-marked spans in the Portable Text path.
   * Mirrors `emphasis.tone` for the string path. Default `"jersey-deep"`.
   */
  accentTone?: EditorialHeadingAccentTone;
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

const ACCENT_TONE_CLASS: Record<EditorialHeadingAccentTone, string> = {
  "jersey-deep": "text-jersey-deep",
  warm: "text-warm",
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

function renderPortableTextTitle(
  blocks: PortableTextBlock[],
  accentTone: EditorialHeadingAccentTone,
): {
  body: ReactNode;
  endsWithPeriod: boolean;
} {
  const block = blocks[0];
  if (!block || !Array.isArray((block as { children?: unknown }).children)) {
    return { body: null, endsWithPeriod: false };
  }
  const spans = (block as PortableTextBlock).children as TitleSpan[];
  const flat = spans.map((s) => s.text ?? "").join("");
  const endsWithPeriod = flat.trim().endsWith(".");
  const lastIdx = spans.length - 1;
  const accentClass = ACCENT_TONE_CLASS[accentTone];
  const body = (
    <>
      {spans.map((span, i) => {
        const isAccent = (span.marks ?? []).includes("accent");
        const text =
          i === lastIdx && !endsWithPeriod
            ? ensureTrailingPeriod(span.text ?? "")
            : (span.text ?? "");
        if (isAccent) {
          return (
            <em
              key={span._key ?? i}
              className={cn("font-display italic", accentClass)}
            >
              {text}
            </em>
          );
        }
        return <span key={span._key ?? i}>{text}</span>;
      })}
    </>
  );
  return { body, endsWithPeriod };
}

export function EditorialHeading({
  level,
  children,
  size = "display-lg",
  emphasis,
  tone = "ink",
  accentTone = "jersey-deep",
  className,
}: EditorialHeadingProps) {
  let body: ReactNode;

  if (typeof children !== "string") {
    body = renderPortableTextTitle(children, accentTone).body;
  } else {
    const display = ensureTrailingPeriod(children);
    body = display;
    if (emphasis) {
      const split = splitOnEmphasis(display, emphasis.text);
      if (!split) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[EditorialHeading] emphasis.text "${emphasis.text}" not found in heading children "${display}"`,
          );
        }
      } else {
        const isHighlight = !!emphasis.highlight;
        const emphasisTone = emphasis.tone ?? "jersey-deep";
        const emEl = (
          <em
            className={cn(
              "font-display italic",
              !isHighlight && ACCENT_TONE_CLASS[emphasisTone],
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
