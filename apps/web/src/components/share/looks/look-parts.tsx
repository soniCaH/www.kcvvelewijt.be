import type React from "react";
import {
  BODY_FONT,
  DISPLAY_FONT,
  GRAIN_DATA_URL,
  KCVV_LOGO,
  MONO_FONT,
  TOKENS,
} from "../constants";
import { SoccerBall } from "@/lib/icons.redesign";
import { CardGraphic, CrestMatchup } from "../shared/ShareElements";
import { toSameOriginImage } from "../shared/theme";
import type { ShareContent, TitleRun } from "./share-content";

// Shared vocabulary of the four new share looks (A Kaart, B Plakboek,
// C Affiche, E Ticket — #3535), lifted from the #3509 prototype. Inline styles
// with concrete token values on purpose: html-to-image captures computed
// styles, the proven capture-safe shape for this surface (see constants.ts).

export type LookId = "kaart" | "plakboek" | "affiche" | "ticket";
export type ShareFormat = "story" | "square";
export type ShareTheme = "licht" | "donker";
export type WashStep = "zacht" | "normaal" | "sterk";
export type CoverMode = "foto" | "affiche_wazig" | "reservefoto";

/** Per block id, an offset in capture pixels (#3537 fills this in). */
export type BlockLayout = Record<
  string,
  { x: number; y: number; layer: "voor" | "achter" }
>;

export interface LookProps {
  content: ShareContent;
  format: ShareFormat;
  theme: ShareTheme;
  /** Look C only; the other looks have no wash. */
  wash: WashStep;
  coverMode: CoverMode;
  blocks: BlockLayout;
  /** Which picture of the look's fallback set fills an empty photo slot. */
  fallbackIndex: number;
}

export const W = 1080;
export const H: Record<ShareFormat, number> = { story: 1920, square: 1080 };

// ── Fallback pictures (#3518): each look's own AI set, uneven on purpose ───
const FALLBACK_SET: Record<LookId, { letter: string; picks: number[] }> = {
  kaart: { letter: "A", picks: [1, 3, 4, 5, 8] },
  plakboek: { letter: "B", picks: [1, 2, 3, 4, 6, 7, 8] },
  affiche: { letter: "C", picks: [1, 3, 5, 7, 8] },
  ticket: { letter: "E", picks: [1, 3, 7, 8] },
};

/** How many pictures a look's fallback set holds (the rotation wraps there). */
export const fallbackCount = (look: LookId) => FALLBACK_SET[look].picks.length;

export function fallbackPicture(look: LookId, index: number): string {
  const { letter, picks } = FALLBACK_SET[look];
  return `/images/share-fallback/${letter}-${picks[index % picks.length]}.webp`;
}

// ── Wash (#3522), look C only ──────────────────────────────────────────────
const WASH: Record<
  ShareTheme,
  Record<
    WashStep,
    { top: number; ramp: number; plateau: number; bottom: number }
  >
> = {
  licht: {
    zacht: { top: 0.45, ramp: 55, plateau: 80, bottom: 0.75 },
    normaal: { top: 0.6, ramp: 45, plateau: 72, bottom: 0.88 },
    sterk: { top: 0.7, ramp: 32, plateau: 60, bottom: 0.97 },
  },
  donker: {
    zacht: { top: 0.45, ramp: 55, plateau: 80, bottom: 0.6 },
    normaal: { top: 0.6, ramp: 45, plateau: 72, bottom: 0.7 },
    sterk: { top: 0.7, ramp: 32, plateau: 60, bottom: 0.8 },
  },
};

export const washRgb = (theme: ShareTheme) =>
  theme === "donker" ? "8,26,18" : "245,241,230";

/** The spec's 5-stop gradient for one theme + step. */
export function washGradient(theme: ShareTheme, step: WashStep): string {
  const s = WASH[theme][step];
  const c = washRgb(theme);
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return (
    `linear-gradient(180deg, rgba(${c},${s.top}) 0%, rgba(${c},0) 20%, ` +
    `rgba(${c},${r(s.bottom * 0.16)}) ${s.ramp}%, ` +
    `rgba(${c},${r(s.bottom * 0.86)}) ${s.plateau}%, rgba(${c},${s.bottom}) 100%)`
  );
}

/** Title accent: jersey-deep on a light ground, warm on a dark one. */
export const accentOf = (theme: ShareTheme) =>
  theme === "donker" ? TOKENS.warm : TOKENS.jerseyDeep;

// ── Atoms ──────────────────────────────────────────────────────────────────
export function Canvas({
  format,
  bg,
  children,
}: {
  format: ShareFormat;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: W,
        height: H[format],
        position: "relative",
        overflow: "hidden",
        background: bg,
        fontFamily: BODY_FONT,
      }}
    >
      {children}
    </div>
  );
}

export function Grain() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: GRAIN_DATA_URL,
        mixBlendMode: "multiply",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

/** The club crest; a match story adds its squad badge (`A`, `U17`) beside it. */
export function Crest({ size, squad }: { size: number; squad?: string }) {
  const crest = (
    <img
      src={KCVV_LOGO}
      alt="KCVV Elewijt"
      style={{ width: size, height: size, display: "block" }}
    />
  );
  if (!squad) return crest;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.2 }}>
      {crest}
      <span
        style={{
          background: TOKENS.ink,
          color: TOKENS.cream,
          padding: `${size * 0.08}px ${size * 0.2}px`,
          fontFamily: MONO_FONT,
          fontWeight: 700,
          fontSize: size * 0.42,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {squad}
      </span>
    </div>
  );
}

/** The match block: both crests before kick-off, the score after. */
export function Hero({
  content,
  color,
  size,
}: {
  content: ShareContent;
  color: string;
  size: number;
}) {
  const hero = content.hero;
  if (!hero) return null;
  if (hero.kind === "crests")
    return (
      <CrestMatchup
        crests={hero.crests}
        size={Math.round(220 * size)}
        gap={Math.round(56 * size)}
        style={{ justifyContent: "flex-start" }}
      />
    );
  return (
    <span
      style={{
        display: "block",
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        fontSize: 220 * size,
        lineHeight: 0.85,
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
        color,
      }}
    >
      {hero.score}
    </span>
  );
}

/** Tilted mono tab, ink border, hard paper shadow. */
export function Stamp({
  label,
  fill,
  onFill,
  size,
}: {
  label: string;
  fill: string;
  onFill: string;
  size: number;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        transform: "rotate(2deg)",
        background: fill,
        color: onFill,
        border: `4px solid ${TOKENS.ink}`,
        boxShadow: `8px 8px 0 ${TOKENS.ink}`,
        padding: `${size * 0.4}px ${size * 0.8}px`,
        fontFamily: MONO_FONT,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

/** Mono uppercase kicker with a rule. */
export function RuleKicker({
  text,
  color,
  size,
}: {
  text: string;
  color: string;
  size: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, color }}>
      <span
        style={{
          fontFamily: MONO_FONT,
          fontWeight: 600,
          fontSize: size,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <span style={{ flex: 1, height: 4, background: color }} />
    </div>
  );
}

function titleSize(runs: TitleRun[], base: number): number {
  // Long titles step down so they never run off the canvas.
  const length = runs.reduce((n, r) => n + r.text.length, 0);
  if (length > 80) return Math.round(base * 0.62);
  if (length > 55) return Math.round(base * 0.76);
  if (length > 35) return Math.round(base * 0.88);
  return base;
}

export function Title({
  runs,
  size,
  color,
  accent,
}: {
  runs: TitleRun[];
  size: number;
  color: string;
  accent: string;
}) {
  return (
    <h1
      lang="nl"
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        fontSize: titleSize(runs, size),
        lineHeight: 0.98,
        letterSpacing: "-0.015em",
        margin: 0,
        color,
        hyphens: "auto",
        overflowWrap: "break-word",
      }}
    >
      {runs.map((run, i) =>
        run.accent ? (
          <em key={i} style={{ fontStyle: "italic", color: accent }}>
            {run.text}
          </em>
        ) : (
          <span key={i}>{run.text}</span>
        ),
      )}
    </h1>
  );
}

export function Info({
  lines,
  color,
  size,
}: {
  lines: string[];
  color: string;
  size: number;
}) {
  if (lines.length === 0) return null;
  return (
    <div
      style={{
        fontFamily: MONO_FONT,
        fontSize: size,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color,
        lineHeight: 1.35,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {lines.map((line, i) => (
        <span key={i}>{line}</span>
      ))}
    </div>
  );
}

/** Never "link in bio": there is no link to promise. */
export function Cta({ color, size }: { color: string; size: number }) {
  return (
    <span
      style={{
        fontFamily: MONO_FONT,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
      }}
    >
      Meer op kcvvelewijt.be
    </span>
  );
}

export function Tape({
  color,
  rotate,
  style,
}: {
  color: string;
  rotate: number;
  style: React.CSSProperties;
}) {
  return (
    <span
      style={{
        position: "absolute",
        width: 220,
        height: 56,
        background: color,
        opacity: 0.88,
        transform: `rotate(${rotate}deg)`,
        zIndex: 3,
        ...style,
      }}
    />
  );
}

/** Day + month block — the event detail. */
export function DateBlock({
  content,
  color,
  background,
  size,
}: {
  content: ShareContent;
  color: string;
  background?: string;
  size: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        border: background ? "none" : `4px solid ${color}`,
        background,
        padding: `${12 * size}px ${24 * size}px`,
        color,
      }}
    >
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 900,
          fontSize: 110 * size,
          lineHeight: 0.9,
        }}
      >
        {content.dateBlock.day}
      </span>
      <span
        style={{
          fontFamily: MONO_FONT,
          fontWeight: 700,
          fontSize: 34 * size,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {content.dateBlock.month}
      </span>
    </span>
  );
}

/** One detail per type — the thing that tells two stories apart. */
export function Detail({
  content,
  color,
  size,
}: {
  content: ShareContent;
  color: string;
  size: number;
}) {
  const mono: React.CSSProperties = {
    fontFamily: MONO_FONT,
    fontWeight: 700,
    fontSize: 40 * size,
    letterSpacing: "0.12em",
    color,
  };
  switch (content.detail) {
    case "quote":
      return (
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 900,
            fontSize: 260 * size,
            lineHeight: 0.6,
            color,
            display: "block",
            height: 120 * size,
          }}
        >
          “
        </span>
      );
    case "arrow":
      return <span style={mono}>→ KCVV ELEWIJT</span>;
    case "whistle":
      return <span style={mono}>■ Eindsignaal</span>;
    case "vs":
      return (
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 120 * size,
            lineHeight: 0.8,
            color,
          }}
        >
          vs.
        </span>
      );
    case "dateblock":
      return <DateBlock content={content} color={color} size={size} />;
    case "halftime":
      return (
        <span
          style={{
            ...mono,
            display: "inline-block",
            fontSize: 72 * size,
            border: `4px solid ${color}`,
            padding: `${8 * size}px ${22 * size}px`,
            transform: "rotate(-3deg)",
          }}
        >
          45&apos;
        </span>
      );
    case "minuteBall":
    case "minute":
      // The spec's "minute disc" is a square box on purpose: sharp corners
      // are a design-system rule (no radius anywhere on the site).
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16 * size,
            border: `4px solid ${color}`,
            padding: `${10 * size}px ${26 * size}px`,
            fontFamily: DISPLAY_FONT,
            fontWeight: 900,
            fontSize: 96 * size,
            lineHeight: 1,
            color,
          }}
        >
          {content.detail === "minuteBall" && (
            <SoccerBall
              aria-hidden="true"
              style={{ width: 80 * size, height: 80 * size, flexShrink: 0 }}
            />
          )}
          {content.minute}&apos;
        </span>
      );
    case "card": {
      // The card graphic the W disciplinary templates draw, scaled down.
      const k = 0.3 * size;
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 28 * size,
            ...mono,
            fontFamily: DISPLAY_FONT,
            fontSize: 96 * size,
            lineHeight: 1,
          }}
        >
          <span style={{ width: 460 * k, height: 656 * k, flexShrink: 0 }}>
            <span
              style={{
                display: "block",
                transform: `scale(${k})`,
                transformOrigin: "top left",
              }}
            >
              <CardGraphic
                color={content.card === "red" ? TOKENS.brick : TOKENS.warm}
                rotate={-6}
              />
            </span>
          </span>
          {content.minute}&apos;
        </span>
      );
    }
    case "none":
      return null;
  }
}

/**
 * True when the slot shows the look's own AI fallback set — the same branch
 * `LookPhoto` takes. This, not `usesFallback`, drives the fallback rotation:
 * the event fallback picture is not part of any set.
 */
export function usesAiFallback(content: ShareContent, coverMode: CoverMode) {
  return (
    !content.photo ||
    (coverMode === "reservefoto" && content.photo.source === "cover")
  );
}

/**
 * True when the slot shows any fallback picture (AI set or event fallback) —
 * the spec's `fallback_used` for analytics (#3539).
 */
export function usesFallback(content: ShareContent, coverMode: CoverMode) {
  return (
    !content.photo ||
    content.photo.source === "fallback" ||
    (coverMode === "reservefoto" && content.photo.source === "cover")
  );
}

/**
 * The look's photo slot, filling its positioned parent, whatever its size.
 * `Foto` fills the slot with the cover, positioned on its hotspot (so the
 * focus holds for any slot shape, no server crop); `Affiche wazig` shows
 * the whole flyer, taped on, over the same image blurred and scaled up so the
 * blur does not fade at the edges; `Reservefoto` swaps in the look's own
 * fallback picture. An empty slot always takes the fallback.
 */
export function LookPhoto({
  look,
  content,
  coverMode,
  fallbackIndex,
  position = "center",
  filter,
}: {
  look: LookId;
  content: ShareContent;
  coverMode: CoverMode;
  fallbackIndex: number;
  /** Where a fallback or own picture anchors; a cover uses its hotspot. */
  position?: string;
  filter?: string;
}) {
  const photo = content.photo;
  const fill: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: position,
    filter,
  };
  const frame = (child: React.ReactNode) => (
    // A size container: the taped flyer below sizes itself to the slot (cq units).
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        containerType: "size",
      }}
    >
      {child}
    </div>
  );

  if (!photo || (coverMode === "reservefoto" && photo.source === "cover")) {
    return frame(
      <img
        src={toSameOriginImage(fallbackPicture(look, fallbackIndex), 1080)}
        alt=""
        style={fill}
      />,
    );
  }
  if (photo.source !== "cover") {
    return frame(
      <img src={toSameOriginImage(photo.src, 1080)} alt="" style={fill} />,
    );
  }

  // The cover URL may already carry the editor's crop (`?rect=…`).
  const sep = photo.src.includes("?") ? "&" : "?";
  const whole = toSameOriginImage(`${photo.src}${sep}w=1080&fit=max`, 1080);
  if (coverMode === "foto") {
    const { x, y } = photo.focal;
    return frame(
      <img
        src={whole}
        alt=""
        style={{ ...fill, objectPosition: `${x * 100}% ${y * 100}%` }}
      />,
    );
  }

  return frame(
    <>
      <img
        src={whole}
        alt=""
        style={{
          ...fill,
          objectPosition: "center",
          // ≈ 16 px at 1080 wide; scaled 1.06 so the blur keeps its edges.
          filter: "blur(16px)",
          transform: "scale(1.06)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            position: "relative",
            display: "block",
            lineHeight: 0,
            transform: "rotate(-1.5deg)",
            boxShadow: "0 18px 40px rgba(10,10,10,0.3)",
          }}
        >
          <Tape
            color={TOKENS.creamDeep}
            rotate={-4}
            style={{ top: -24, left: "50%", marginLeft: -110 }}
          />
          <img
            src={whole}
            alt=""
            style={{
              display: "block",
              maxWidth: "80cqw",
              maxHeight: "80cqh",
              width: "auto",
              height: "auto",
              border: `14px solid ${TOKENS.cream}`,
            }}
          />
        </span>
      </div>
    </>,
  );
}
