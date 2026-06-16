import React, { useLayoutEffect, useRef, useState } from "react";
import { DISPLAY_FONT, GRAIN_DATA_URL, MONO_FONT, TOKENS } from "../constants";
import { useSharePalette } from "./ShareFrame";
import { formatScore, type CrestEntry } from "./theme";

/** Mono uppercase kicker label. */
export function Kicker({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  return (
    <span
      style={{
        fontFamily: MONO_FONT,
        fontSize: "42px",
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: palette.kicker,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Freight Display headline: an italic accent word plus sentiment punctuation —
 * a warm `!` for positive shouts, a sober `.` elsewhere.
 */
export function Headline({
  children,
  punctuation,
  fontSize,
  style,
}: {
  children: React.ReactNode;
  punctuation: "bang" | "dot" | "none";
  fontSize: number;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  const mark = punctuation === "bang" ? "!" : punctuation === "dot" ? "." : "";
  return (
    <h1
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        fontStyle: "normal",
        fontSize: `${fontSize}px`,
        lineHeight: 0.86,
        letterSpacing: "-0.015em",
        margin: 0,
        color: palette.text,
        ...style,
      }}
    >
      <span style={{ fontStyle: "italic", color: palette.emphasis }}>
        {children}
      </span>
      {mark && <span style={{ color: palette.punct }}>{mark}</span>}
    </h1>
  );
}

/**
 * Freight Display italic name (player / club). Pass `accent` to colour it with
 * the register's emphasis hue (jersey-deep on cream, warm on dark/image) — used
 * for the opposing club so it reads correctly in every register.
 *
 * Names are arbitrary-length data, so the text auto-scales DOWN to fit its
 * container on a single line (never wraps/clips) — a long name like
 * "Amirgan Bouakhouf" shrinks instead of breaking. The scale is applied to the
 * DOM before `html-to-image` captures it. Degrades to the base size where the
 * DOM can't be measured (e.g. happy-dom in tests).
 */
export function ShareName({
  children,
  fontSize,
  color,
  accent = false,
  minFontSize = 56,
  style,
}: {
  children: React.ReactNode;
  fontSize: number;
  color?: string;
  accent?: boolean;
  /** Floor the auto-fit so names stay legible (default 56px). */
  minFontSize?: number;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  const outerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(fontSize);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const text = textRef.current;
    if (!outer || !text) return;
    const available = outer.clientWidth;
    if (available <= 0) return; // not measurable (e.g. happy-dom) → keep base
    // Measure intrinsic (single-line) width at the base size, then scale to fit.
    text.style.fontSize = `${fontSize}px`;
    const intrinsic = text.scrollWidth;
    // Scale DOWN only: clamp to [minFontSize, fontSize] so a small base size
    // (< minFontSize) is never upscaled.
    const next =
      intrinsic > available
        ? Math.min(
            fontSize,
            Math.max(
              minFontSize,
              Math.floor((fontSize * available) / intrinsic),
            ),
          )
        : fontSize;
    setSize(next);
  }, [fontSize, children, minFontSize]);

  return (
    <div ref={outerRef} style={{ width: "100%", ...style }}>
      <span
        ref={textRef}
        style={{
          display: "inline-block",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          fontFamily: DISPLAY_FONT,
          fontWeight: 900,
          fontStyle: "italic",
          lineHeight: 1,
          fontSize: `${size}px`,
          color: color ?? (accent ? palette.emphasis : palette.text),
        }}
      >
        {children}
      </span>
    </div>
  );
}

/** Big Freight Display score (renders a tight en-dash between digits). */
export function Scoreline({
  children,
  fontSize,
  style,
}: {
  children: string;
  fontSize: number;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  const display = formatScore(children);
  return (
    <div
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        letterSpacing: "-0.02em",
        lineHeight: 0.86,
        fontSize: `${fontSize}px`,
        color: palette.scoreline,
        ...style,
      }}
    >
      {display}
    </div>
  );
}

/** Mono secondary/meta text. */
export function Meta({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  return (
    <div
      style={{
        fontFamily: MONO_FONT,
        fontSize: "42px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: color ?? palette.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Stylish club-crest tile — a square paper chip (ink border + hard offset
 * shadow, slight rotation) holding a club logo. Used for the matchup hero.
 */
function CrestTile({
  logoUrl,
  alt,
  size = 300,
  rotate = 0,
}: {
  logoUrl: string;
  alt: string;
  size?: number;
  rotate?: number;
}) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${Math.round(size * 0.13)}px`,
        background: TOKENS.cream,
        border: `5px solid ${TOKENS.ink}`,
        boxShadow: `14px 16px 0 0 ${TOKENS.ink}`,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={alt}
        crossOrigin="anonymous"
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

/** A centred row of club-crest tiles (the matchup hero). */
export function CrestMatchup({
  crests,
  size = 300,
  gap = 72,
  style,
}: {
  crests: CrestEntry[];
  size?: number;
  gap?: number;
  style?: React.CSSProperties;
}) {
  if (crests.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${gap}px`,
        ...style,
      }}
    >
      {crests.map((c, i) => (
        <CrestTile
          key={`${c.alt}-${i}`}
          logoUrl={c.logo}
          alt={c.alt}
          size={size}
          rotate={c.rotate}
        />
      ))}
    </div>
  );
}

/** Freight em-dash separator in the register's accent hue. */
export function Dash({
  fontSize = 90,
  style,
}: {
  fontSize?: number;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  return (
    <div
      aria-hidden="true"
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        lineHeight: 1,
        fontSize: `${fontSize}px`,
        color: palette.emphasis,
        ...style,
      }}
    >
      —
    </div>
  );
}

/** Square shirt-number disc (sharp corners — design-system rule). */
export function NumDisc({
  children,
  size = 168,
  fontSize = 100,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  fontSize?: number;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  return (
    <span
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: palette.numDiscBg,
        color: palette.numDiscText,
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 900,
          fontSize: `${fontSize}px`,
          lineHeight: 1,
          // Lining figures sit on the cap-height baseline (no descender on "9"),
          // so the glyph is optically centred in the badge.
          fontVariantNumeric: "lining-nums",
          fontFeatureSettings: '"lnum" 1, "tnum" 1',
        }}
      >
        {children}
      </span>
    </span>
  );
}

/** Striped jersey/cream seam (StripedSeam vocabulary). */
export function Seam({
  width = "78%",
  style,
}: {
  width?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height: "46px",
        backgroundImage: `repeating-linear-gradient(-52deg, ${TOKENS.jerseyDeep} 0 28px, ${TOKENS.cream} 28px 56px)`,
        borderTop: `4px solid ${TOKENS.ink}`,
        borderBottom: `4px solid ${TOKENS.ink}`,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/** Dotted halftone band — a textured rule. */
export function HalftoneBand({
  width = "70%",
  color,
  height = 50,
  style,
}: {
  width?: string;
  color?: string;
  height?: number;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height: `${height}px`,
        color: color ?? palette.muted,
        backgroundImage: "radial-gradient(currentColor 3.7px, transparent 4px)",
        backgroundSize: "28px 28px",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/**
 * Full-bleed, subtle vertical pitch-stripe texture for the dark register.
 * Faint cream bands over the jersey-deep-dark ground — no hard seam, just a
 * cohesive "pitch" texture across the whole poster.
 */
export function PitchStripes({
  opacity = 0.05,
  bandWidth = 84,
}: {
  opacity?: number;
  bandWidth?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        backgroundImage: `repeating-linear-gradient(90deg, rgba(245,241,230,${opacity}) 0 ${bandWidth}px, transparent ${bandWidth}px ${bandWidth * 2}px)`,
      }}
    />
  );
}

/** Oversized faint ghost numeral behind the content. */
export function GhostNumeral({
  children,
  fontSize,
  color,
  style,
}: {
  children: React.ReactNode;
  fontSize: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        lineHeight: 0.8,
        userSelect: "none",
        fontSize: `${fontSize}px`,
        color: color ?? palette.ghost,
        zIndex: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Oversized faint ghost letter (italic) behind the content. */
export function GhostLetter({
  children,
  fontSize,
  color,
  style,
}: {
  children: React.ReactNode;
  fontSize: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  const palette = useSharePalette();
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        fontStyle: "italic",
        lineHeight: 0.8,
        userSelect: "none",
        fontSize: `${fontSize}px`,
        color: color ?? palette.ghost,
        zIndex: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Blown-up disciplinary card (yellow = warm, red = brick). A single rotated
 * group holds the card plus the tape strip, so the texture, inner keyline,
 * and tape all share the card's exact angle.
 */
export function CardGraphic({
  color,
  rotate = 0,
  width = 460,
  height = 656,
  style,
}: {
  color: string;
  rotate?: number;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) {
  const tape: React.CSSProperties = {
    position: "absolute",
    width: "188px",
    height: "62px",
    background: "rgba(245, 241, 230, 0.86)",
    border: "2px solid rgba(10, 10, 10, 0.12)",
    boxShadow: "0 6px 0 rgba(0,0,0,0.07)",
  };
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotate}deg)`,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* the card itself */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: color,
          border: `6px solid ${TOKENS.ink}`,
          boxShadow: "21px 25px 0 0 rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {/* paper-grain texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: GRAIN_DATA_URL,
            mixBlendMode: "multiply",
            opacity: 0.8,
          }}
        />
        {/* inner keyline */}
        <div
          style={{
            position: "absolute",
            inset: "26px",
            border: "3px solid rgba(0,0,0,0.22)",
          }}
        />
        {/* diagonal sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 45%)",
          }}
        />
      </div>
      {/* single tape strip pinning the card (rotates with the group) */}
      <span
        style={{
          ...tape,
          top: "-30px",
          left: "44px",
          transform: "rotate(-8deg)",
        }}
      />
    </div>
  );
}
