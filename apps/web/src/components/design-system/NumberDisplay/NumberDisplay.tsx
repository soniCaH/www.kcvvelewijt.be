import { createElement } from "react";
import { cn } from "@/lib/utils/cn";

export type NumberDisplaySize = "display-2xl" | "display-xl" | "display-lg";
/**
 * `jersey` (the bright decorative green, `#4acf52`) is deliberately absent.
 * DESIGN.md's Two-Greens Rule reserves it for decoration only — stripe
 * patterns, tape strips, spinner bars — and forbids it from ever carrying
 * text (1.80:1 on cream, illegible at any size). `<NumberDisplay>` only
 * ever renders text, so there is no ground on which `jersey` is legitimate
 * here: `jersey-deep` (cream) carries any text-bearing green this
 * component needs. Green-on-ink text would need `jersey-bright`, but no
 * call site renders `<NumberDisplay>` on an ink ground today — add that
 * tone when one does, rather than reintroducing `jersey` for it (#3031).
 */
export type NumberDisplayTone = "jersey-deep" | "ink" | "cream";
export type NumberDisplayAs = "span" | "div" | "p";

export interface NumberDisplayProps {
  value: string | number;
  size?: NumberDisplaySize;
  tone?: NumberDisplayTone;
  prefix?: string;
  label?: string;
  as?: NumberDisplayAs;
  className?: string;
}

const SIZE_CLASS: Record<NumberDisplaySize, string> = {
  "display-2xl": "text-display-2xl",
  "display-xl": "text-display-xl",
  "display-lg": "text-display-lg",
};

const TONE_CLASS: Record<NumberDisplayTone, string> = {
  "jersey-deep": "text-jersey-deep",
  ink: "text-ink",
  cream: "text-cream",
};

export function NumberDisplay({
  value,
  size = "display-xl",
  tone = "ink",
  prefix,
  label,
  as = "span",
  className,
}: NumberDisplayProps) {
  // The "#" glyph reads awkwardly in italic Freight; render it in mono
  // (hashtag-style) at a smaller size for that case. Other prefixes (e.g.
  // "nr.") stay in italic Freight Display.
  const isHashPrefix = prefix === "#";
  const numberSection = (
    <span
      className={cn(
        // <NumberDisplay> is the SUBJECT of its surface (#2516 rule 1: the
        // raffle stats on /club/ultras via RaffleCallout, and the shirt
        // number on /spelers/[slug] via PlayerHero.tsx), so it keeps its
        // display face and adds no font-variant-numeric class at all (#2579).
        // No class needed to get oldstyle figures — the family's default
        // figure set already IS oldstyle, measured byte-identical to
        // `oldstyle-nums` on every Freight face. `lining-nums` used to be
        // set here on the (measured false) premise that it delivered an
        // equal-width tabular set; #2516 re-measured it and found the
        // opposite — on `freight-big-pro` it changes digit widths without
        // ever equalising them (spread 47.4 → 37.4). `tabular-nums` was
        // never a candidate either: the kit ships no `tnum` feature on any
        // face this site uses.
        "font-display-big inline-flex items-baseline gap-1.5 font-black",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
      )}
    >
      {prefix &&
        (isHashPrefix ? (
          <span className="font-mono text-[0.4em] font-medium tracking-[0.04em]">
            {prefix}
          </span>
        ) : (
          <span className="font-display text-[0.55em] font-semibold italic">
            {prefix}
          </span>
        ))}
      <span>{value}</span>
    </span>
  );

  const labelSection = label ? (
    <span
      className={cn(
        "text-mono-sm font-mono leading-none tracking-[0.08em] uppercase",
        tone === "cream" ? "text-cream/70" : "text-ink-muted",
      )}
    >
      {label}
    </span>
  ) : null;

  // span (default) keeps the number inline; div/p wrap label + value as a
  // flex column so labelled instances stack properly inside stat strips.
  const stack = label && as !== "span";

  return createElement(
    as,
    {
      "data-size": size,
      "data-tone": tone,
      className: cn(
        stack
          ? "inline-flex flex-col items-start gap-1"
          : "inline-flex items-baseline gap-1.5",
        className,
      ),
    },
    numberSection,
    labelSection,
  );
}
