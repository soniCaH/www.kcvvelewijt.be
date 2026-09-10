import { createElement, type ReactNode } from "react";
import type { PortableTextBlock } from "@portabletext/react";
import { cn } from "@/lib/utils/cn";
import { AccentEm, splitOnAccent, type AccentTone } from "../_internal/accent";

interface TitleSpan {
  _type?: "span";
  _key?: string;
  text?: string;
  marks?: string[];
}
import { HighlighterStroke } from "../HighlighterStroke";

export type EditorialHeadingSize =
  "display-2xl" | "display-xl" | "display-lg" | "display-md" | "display-sm";

export type EditorialHeadingTone = "ink" | "jersey-deep" | "cream";

/**
 * Accent colour for the italic emphasis (string-emphasis path) or the
 * `accent`-marked spans (Portable Text path).
 *
 * - `jersey-deep` (default) — readable on cream / paper surfaces.
 * - `warm` — readable on jersey-deep / ink surfaces (`text-warm` token
 *   landed in #1697). Used by `<FeaturedEventBand>` and `<YouthBlock>`.
 *
 * An alias of the shared `AccentTone` (`../_internal/accent`) — kept as its
 * own exported name so this module's public API is unchanged for existing
 * importers (#2576 review finding 8 moved the mechanism, not the name).
 */
export type EditorialHeadingAccentTone = AccentTone;

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

// All five display steps carry their own letter-spacing as ramp properties
// now (D14/Y8, decision-sheet §8, #2617) — display-2xl/xl at -0.035em,
// display-lg/md/sm at -0.025em (the exact value `tracking-tight` already
// resolved to here — a values-only move, not a retune; see the ramp's own
// comment in globals.css). No hand-applied `tracking-tight` survives in
// this map, or the ramp's own value and the hand literal would both apply.
const SIZE_CLASS: Record<EditorialHeadingSize, string> = {
  "display-2xl": "font-display-big text-display-2xl font-black",
  "display-xl": "font-display text-display-xl font-bold",
  "display-lg": "font-display text-display-lg font-bold",
  "display-md": "font-display text-display-md font-bold",
  "display-sm": "font-display text-display-sm font-semibold",
};

const TONE_CLASS: Record<EditorialHeadingTone, string> = {
  ink: "text-ink",
  "jersey-deep": "text-jersey-deep",
  cream: "text-cream",
};

function ensureTrailingPeriod(text: string): string {
  // A heading already terminated by sentence punctuation keeps it — appending a
  // period to a question ("…langs de lijn?") or exclamation would be wrong.
  return /[.?!]$/.test(text.trimEnd()) ? text : `${text}.`;
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
            <AccentEm key={span._key ?? i} tone={accentTone}>
              {text}
            </AccentEm>
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
      const split = splitOnAccent(display, emphasis.text);
      if (!split) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[EditorialHeading] emphasis.text "${emphasis.text}" not found in heading children "${display}"`,
          );
        }
      } else {
        const isHighlight = !!emphasis.highlight;
        const emphasisTone = emphasis.tone ?? "jersey-deep";
        // The highlight (marker) variant owns its own colour — no tone
        // class here, unlike the plain `<AccentEm>` register below — so it
        // stays a bare inline `<em>` rather than going through `<AccentEm>`.
        const emEl = isHighlight ? (
          <em className="font-display italic">{split.match}</em>
        ) : (
          <AccentEm tone={emphasisTone}>{split.match}</AccentEm>
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
      className: cn(SIZE_CLASS[size], TONE_CLASS[tone], className),
    },
    body,
  );
}
