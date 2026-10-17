"use client";

// PROTOTYPE (#3509) — throwaway. Answers: which look family wins for news and
// event stories, how each of the six article types differs inside it, how an
// event shows its eventType, and how a no-cover event looks with the fallback.
// Five structurally different families, A..E, each as story (1080×1920) and
// square (1080×1080), on real Sanity content. Inline styles on purpose: the
// real templates are captured with html-to-image, so this keeps that shape.

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import {
  BODY_FONT,
  DISPLAY_FONT,
  GRAIN_DATA_URL,
  KCVV_LOGO,
  MONO_FONT,
  TOKENS,
} from "../constants";

export interface LookItem {
  key: string;
  kind: "article" | "event" | "match";
  articleType?: string;
  /** #3519: a match moment rendered in the look. */
  match?: MatchBits;
  eventType?: string;
  title: string;
  /** Title split on the `accent` decorator; events have one plain span. */
  spans: { text: string; accent: boolean }[];
  date: string | null;
  time: string | null;
  location: string | null;
  img: string | null;
  hx: number;
  hy: number;
  /** #3518: a round-1 AI fallback draft shown in place of FALLBACK. */
  fallback?: string;
  draft?: number;
}

export type Moment =
  "kickoff" | "halftime" | "fulltime" | "goal" | "against" | "card";
export interface MatchBits {
  moment: Moment;
  away: string;
  awayLogo: string;
  competition: string;
  score?: string;
  minute?: string;
  player?: string;
  card?: "yellow" | "red";
}

/** #3519 drag tags: `levels` = the variants (1 fine, 2 groups, 3 frame) in which it moves. */
export const mv = (name: string, levels: string) => ({
  "data-move": levels,
  "data-name": name,
});
export const pin = (name: string) => ({ "data-pin": name });

export type Format = "story" | "square";
const W = 1080;
const H: Record<Format, number> = { story: 1920, square: 1080 };
const FALLBACK = "/images/event-fallback.jpg";
const JERSEY_BRIGHT = "#22c55e";

// ── Per-type identity: the word, the colour, one accent ────────────────────
interface TypeStyle {
  label: string;
  /** Colour field this type owns (stamp fill, block ground). */
  fill: string;
  onFill: string;
  accent: "quote" | "none" | "arrow" | "dateblock" | "vs" | "whistle";
}
const ARTICLE_STYLE: Record<string, TypeStyle> = {
  interview: {
    label: "Interview",
    fill: TOKENS.ink,
    onFill: TOKENS.cream,
    accent: "quote",
  },
  announcement: {
    label: "Mededeling",
    fill: TOKENS.cream,
    onFill: TOKENS.ink,
    accent: "none",
  },
  transfer: {
    label: "Transfer",
    fill: TOKENS.jerseyDeep,
    onFill: TOKENS.cream,
    accent: "arrow",
  },
  event: {
    label: "Evenement",
    fill: TOKENS.warm,
    onFill: TOKENS.ink,
    accent: "dateblock",
  },
  matchPreview: {
    label: "Voorbeschouwing",
    fill: TOKENS.jerseyDeepDark,
    onFill: TOKENS.cream,
    accent: "vs",
  },
  matchRecap: {
    label: "Matchverslag",
    fill: TOKENS.inkSoft,
    onFill: TOKENS.cream,
    accent: "whistle",
  },
};
// Same fills as the site's EVENT_TYPE_FILL (event-type-style.ts).
const EVENT_STYLE: Record<string, TypeStyle> = {
  Clubevent: {
    label: "Clubevent",
    fill: TOKENS.jerseyDeep,
    onFill: "#fff",
    accent: "dateblock",
  },
  Supportersactiviteit: {
    label: "Supporters",
    fill: TOKENS.warm,
    onFill: TOKENS.ink,
    accent: "dateblock",
  },
  Jeugdwerking: {
    label: "Jeugdwerking",
    fill: JERSEY_BRIGHT,
    onFill: TOKENS.ink,
    accent: "dateblock",
  },
  Andere: {
    label: "Evenement",
    fill: TOKENS.ink,
    onFill: TOKENS.cream,
    accent: "dateblock",
  },
};
// #3519 placeholder: the real per-moment table is written in the spec (#3510).
const MOMENT_STYLE: Record<Moment, TypeStyle> = {
  kickoff: {
    label: "Aftrap",
    fill: TOKENS.jerseyDeep,
    onFill: TOKENS.cream,
    accent: "none",
  },
  halftime: {
    label: "Rust",
    fill: TOKENS.warm,
    onFill: TOKENS.ink,
    accent: "none",
  },
  fulltime: {
    label: "Eindstand",
    fill: TOKENS.ink,
    onFill: TOKENS.cream,
    accent: "none",
  },
  goal: {
    label: "Goal",
    fill: JERSEY_BRIGHT,
    onFill: TOKENS.ink,
    accent: "none",
  },
  against: {
    label: "Tegengoal",
    fill: TOKENS.inkSoft,
    onFill: TOKENS.cream,
    accent: "none",
  },
  card: { label: "Kaart", fill: "#f2c230", onFill: TOKENS.ink, accent: "none" },
};
function styleOf(it: LookItem): TypeStyle {
  if (it.match) {
    const m = MOMENT_STYLE[it.match.moment];
    if (it.match.moment !== "card") return m;
    return it.match.card === "red"
      ? { ...m, label: "Rode kaart", fill: "#c0392b", onFill: TOKENS.cream }
      : { ...m, label: "Gele kaart" };
  }
  return it.kind === "event"
    ? (EVENT_STYLE[it.eventType ?? "Andere"] ?? EVENT_STYLE.Andere!)
    : (ARTICLE_STYLE[it.articleType ?? "announcement"] ??
        ARTICLE_STYLE.announcement!);
}

// ── Data helpers ───────────────────────────────────────────────────────────
function photo(it: LookItem, w: number, h: number): string {
  if (!it.img) return it.fallback ?? FALLBACK;
  const src = `${it.img}?w=${w}&h=${h}&q=80&fit=crop&crop=focalpoint&fp-x=${it.hx}&fp-y=${it.hy}`;
  // Same-origin via the Next image optimizer — what SharePage does for capture.
  return `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
}
const isEventish = (it: LookItem) =>
  it.kind === "event" ||
  it.articleType === "event" ||
  it.match?.moment === "kickoff";
const hasMeta = (it: LookItem) => isEventish(it) || Boolean(it.match);
/** Match kicker: moment + minute ("Goal · 67'"); else the date line. */
function kickerText(it: LookItem, s: TypeStyle): string {
  if (it.match)
    return [s.label, it.match.minute && `${it.match.minute}'`]
      .filter(Boolean)
      .join(" · ");
  return dateLine(it) || s.label;
}
function dateLine(it: LookItem): string {
  if (!it.date) return "";
  const d = new Date(it.date);
  const day = new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Brussels",
  }).format(d);
  return day;
}
function timeLine(it: LookItem): string | null {
  if (!isEventish(it) || !it.time) return null;
  if (/^\d{2}:\d{2}/.test(it.time)) return it.time.slice(0, 5);
  const d = new Date(it.time);
  return new Intl.DateTimeFormat("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  }).format(d);
}
function dayMonth(it: LookItem): { day: string; month: string } {
  const d = it.date ? new Date(it.date) : new Date();
  return {
    day: new Intl.DateTimeFormat("nl-BE", {
      day: "numeric",
      timeZone: "Europe/Brussels",
    }).format(d),
    month: new Intl.DateTimeFormat("nl-BE", {
      month: "short",
      timeZone: "Europe/Brussels",
    })
      .format(d)
      .replace(".", ""),
  };
}
function metaParts(it: LookItem): string[] {
  if (it.match && it.match.moment !== "kickoff") return [it.match.competition];
  // Owner: date + hour on one line, location on the next.
  const when = [dateLine(it), timeLine(it)].filter(Boolean).join(" · ");
  return [when, isEventish(it) ? it.location : null].filter((x): x is string =>
    Boolean(x),
  );
}
function titleSize(title: string, base: number): number {
  // Long titles step down so they never run off the canvas.
  if (title.length > 80) return Math.round(base * 0.62);
  if (title.length > 55) return Math.round(base * 0.76);
  if (title.length > 35) return Math.round(base * 0.88);
  return base;
}

// ── Site-vocabulary atoms (copies of the real primitives, inline) ──────────
function Crest({ size = 96 }: { size?: number }) {
  return (
    <img
      src={KCVV_LOGO}
      alt="KCVV Elewijt"
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

/** A type colour that equals what sits behind it vanishes: flip to cream/ink. */
function unclash(s: TypeStyle, behind: string): TypeStyle {
  return s.fill === behind
    ? { ...s, fill: TOKENS.cream, onFill: TOKENS.ink }
    : s;
}

/** StampBadge: tilted mono tab, 1.5px ink border, hard paper shadow. */
function Stamp({
  s,
  rotate = 2,
  size = 34,
  style,
}: {
  s: TypeStyle;
  rotate?: number;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        transform: `rotate(${rotate}deg)`,
        background: s.fill,
        color: s.onFill,
        border: `4px solid ${TOKENS.ink}`,
        boxShadow: `8px 8px 0 ${TOKENS.ink}`,
        padding: `${size * 0.4}px ${size * 0.8}px`,
        fontFamily: MONO_FONT,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        lineHeight: 1,
        ...style,
      }}
    >
      {s.label}
    </span>
  );
}

/** Mono uppercase kicker with a rule (MembershipForm head). */
function RuleKicker({
  text,
  color,
  size = 30,
}: {
  text: string;
  color: string;
  size?: number;
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

function Title({
  it,
  size,
  color,
  accent = TOKENS.jerseyDeep,
  maxWidth,
}: {
  it: LookItem;
  size: number;
  color: string;
  accent?: string;
  maxWidth?: number;
}) {
  return (
    <h1
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        fontSize: titleSize(it.title, size),
        lineHeight: 0.98,
        letterSpacing: "-0.015em",
        margin: 0,
        color,
        maxWidth,
        hyphens: "auto",
        overflowWrap: "break-word",
      }}
      lang="nl"
    >
      {it.spans.map((sp, i) =>
        sp.accent ? (
          <span key={i} style={{ fontStyle: "italic", color: accent }}>
            {sp.text}
          </span>
        ) : (
          <span key={i}>{sp.text}</span>
        ),
      )}
    </h1>
  );
}

function Meta({
  it,
  color,
  size = 32,
}: {
  it: LookItem;
  color: string;
  size?: number;
}) {
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
      {metaParts(it).map((m) => (
        <span key={m}>{m}</span>
      ))}
    </div>
  );
}

function Cta({ color, size = 30 }: { color: string; size?: number }) {
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

/** StripedSeam — explicit SVG pattern, like the real primitive. */
function Seam({
  h = 28,
  a = TOKENS.cream,
  b = TOKENS.jerseyDeep,
  vertical = false,
  id,
}: {
  h?: number;
  a?: string;
  b?: string;
  vertical?: boolean;
  id: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={vertical ? h : "100%"}
      height={vertical ? "100%" : h}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width="32"
          height="32"
          patternTransform="rotate(-45)"
        >
          <rect x="0" y="0" width="16" height="32" fill={a} />
          <rect x="16" y="0" width="16" height="32" fill={b} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** TapeStrip — translucent strip at an angle. */
function Tape({
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

/** One accent per type — the thing that tells seven stories apart. */
function Accent({
  it,
  s,
  color,
  size = 1,
}: {
  it: LookItem;
  s: TypeStyle;
  color: string;
  size?: number;
}) {
  switch (s.accent) {
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
      return (
        <span
          style={{
            fontFamily: MONO_FONT,
            fontWeight: 700,
            fontSize: 40 * size,
            letterSpacing: "0.12em",
            color,
          }}
        >
          → KCVV ELEWIJT
        </span>
      );
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
    case "whistle":
      return (
        <span
          style={{
            fontFamily: MONO_FONT,
            fontWeight: 700,
            fontSize: 40 * size,
            letterSpacing: "0.12em",
            color,
          }}
        >
          ■ Eindsignaal
        </span>
      );
    case "dateblock": {
      const { day, month } = dayMonth(it);
      return (
        <span
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            border: `4px solid ${color}`,
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
            {day}
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
            {month}
          </span>
        </span>
      );
    }
    default:
      return null;
  }
}

/** #3519: the match block — crests for Aftrap, the score otherwise, a card for Kaart. */
function Hero({
  it,
  color,
  size = 1,
}: {
  it: LookItem;
  color: string;
  size?: number;
}) {
  const m = it.match;
  if (!m) return null;
  const num: React.CSSProperties = {
    fontFamily: DISPLAY_FONT,
    fontWeight: 900,
    fontSize: 220 * size,
    lineHeight: 0.85,
    color,
    letterSpacing: "-0.02em",
  };
  if (m.moment === "kickoff")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 36 * size }}>
        <Crest size={170 * size} />
        <span style={{ ...num, fontSize: 90 * size, fontStyle: "italic" }}>
          vs.
        </span>
        <img
          src={m.awayLogo}
          alt=""
          style={{ width: 170 * size, height: 170 * size, display: "block" }}
        />
      </div>
    );
  if (m.moment === "card")
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 40 * size }}>
        <span
          style={{
            width: 120 * size,
            height: 170 * size,
            background: m.card === "red" ? "#c0392b" : "#f2c230",
            border: `4px solid ${TOKENS.ink}`,
            transform: "rotate(-8deg)",
            boxShadow: `8px 8px 0 ${TOKENS.ink}`,
          }}
        />
        <span style={num}>{m.minute}&apos;</span>
      </div>
    );
  const [h, a] = (m.score ?? "0-0").split("-");
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 28 * size }}>
      <span style={num}>{h}</span>
      <span style={{ ...num, opacity: 0.5 }}>—</span>
      <span style={num}>{a}</span>
    </div>
  );
}

function Canvas({
  f,
  bg,
  children,
}: {
  f: Format;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: W,
        height: H[f],
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
// #3522: the wash under test. `WashCtx` maps an "r,g,b" wash colour to a CSS
// background; `PhotoWashCtx` also lays it over A/B/E's photo slot.
export const WashCtx = createContext<((rgb: string) => string) | null>(null);
export const PhotoWashCtx = createContext(false);
const washRgb = (dark: boolean) => (dark ? "8,26,18" : "245,241,230");
function Img({ src, style }: { src: string; style?: React.CSSProperties }) {
  const wash = useContext(WashCtx);
  const onPhoto = useContext(PhotoWashCtx);
  const dark = useContext(ThemeCtx) === "dark";
  if (wash && onPhoto)
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <ImgRaw src={src} style={style} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: wash(washRgb(dark)),
          }}
        />
      </div>
    );
  return <ImgRaw src={src} style={style} />;
}
function ImgRaw({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    <img
      src={src}
      alt=""
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style,
      }}
    />
  );
}
function Grain() {
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

// ── Licht / Donker (#3511 switch, here tried on every look) ───────────────
export type Theme = "light" | "dark";
export const ThemeCtx = createContext<Theme>("light");
interface Pal {
  ground: string;
  surface: string;
  edge: string;
  shadow: string;
  text: string;
  soft: string;
  muted: string;
  accent: string;
}
const PAL: Record<Theme, Pal> = {
  light: {
    ground: TOKENS.cream,
    surface: "#fff",
    edge: TOKENS.ink,
    shadow: TOKENS.ink,
    text: TOKENS.ink,
    soft: TOKENS.inkSoft,
    muted: TOKENS.inkMuted,
    accent: TOKENS.jerseyDeep,
  },
  dark: {
    ground: TOKENS.jerseyDeepDark,
    surface: TOKENS.ink,
    edge: TOKENS.cream,
    shadow: TOKENS.jerseyDeep,
    text: TOKENS.cream,
    soft: "rgba(245,241,230,0.86)",
    muted: "rgba(245,241,230,0.6)",
    accent: TOKENS.warm,
  },
};
function usePal(): Pal & { dark: boolean } {
  const t = useContext(ThemeCtx);
  return { ...PAL[t], dark: t === "dark" };
}

// ── A · Kaart — photo up top, a ClippedCard laid over its edge ─────────────
function LookA({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const pal = usePal();
  // Donker = dark-green card on a cream ground (owner: ink card was ugly).
  const p = pal.dark
    ? {
        ...pal,
        ground: TOKENS.cream,
        surface: TOKENS.jerseyDeepDark,
        edge: TOKENS.ink,
        shadow: TOKENS.ink,
      }
    : pal;
  const sq = f === "square";
  const photoH = sq ? 380 : 900;
  const bracket = (pos: "tl" | "br"): React.CSSProperties => ({
    position: "absolute",
    width: 44,
    height: 44,
    border: `5px solid ${p.edge}`,
    ...(pos === "tl"
      ? { top: -18, left: -18, borderRight: 0, borderBottom: 0 }
      : { bottom: -18, right: -18, borderLeft: 0, borderTop: 0 }),
  });
  return (
    <Canvas f={f} bg={p.ground}>
      <Grain />
      {/* Column: the photo takes every pixel the card and footer leave. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}
      >
        <div
          {...pin("Foto")}
          style={{ flex: 1, minHeight: photoH, position: "relative" }}
        >
          <Img src={photo(it, W, H[f])} />
          <div
            {...pin("Clublogo")}
            style={{ position: "absolute", top: 56, left: 64 }}
          >
            <Crest size={sq ? 84 : 104} />
          </div>
        </div>
        <div
          {...mv("Kaart (alles erin)", "3")}
          style={{
            position: "relative",
            margin: sq ? "-170px 72px 0" : "-220px 72px 0",
            background: p.surface,
            border: `5px solid ${p.edge}`,
            boxShadow: `16px 16px 0 ${p.shadow}`,
            padding: sq ? "64px 56px 48px" : "88px 64px 64px",
            display: "flex",
            flexDirection: "column",
            gap: sq ? 24 : 36,
            zIndex: 2,
          }}
        >
          <span style={bracket("tl")} />
          <span style={bracket("br")} />
          <div
            {...mv("Stempel", "1 2")}
            style={{ position: "absolute", top: -30, right: 56, zIndex: 3 }}
          >
            <Stamp s={unclash(s, p.surface)} size={sq ? 28 : 34} />
          </div>
          {it.match && (
            <div {...mv("Uitslag / logo's", "1 2")}>
              <Hero it={it} color={p.text} size={sq ? 0.55 : 0.8} />
            </div>
          )}
          <div
            {...mv("Tekst", "2")}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: sq ? 24 : 36,
            }}
          >
            {s.accent === "quote" && (
              <div {...mv("Aanhalingsteken", "1")}>
                <Accent it={it} s={s} color={p.accent} size={sq ? 0.6 : 1} />
              </div>
            )}
            <div {...mv("Kicker", "1")}>
              <RuleKicker
                text={kickerText(it, s)}
                color={p.accent}
                size={sq ? 26 : 30}
              />
            </div>
            <div {...mv("Titel", "1")}>
              <Title
                it={it}
                size={sq ? 76 : 100}
                color={p.text}
                accent={p.accent}
              />
            </div>
            {hasMeta(it) && (
              <div {...mv("Info", "1")}>
                <Meta it={it} color={p.soft} size={sq ? 26 : 32} />
              </div>
            )}
          </div>
        </div>
        <div
          {...pin("Voet")}
          style={{
            padding: sq ? "40px 72px 36px" : "64px 72px 64px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: MONO_FONT,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "0.16em",
              color: pal.dark ? TOKENS.inkMuted : p.muted,
            }}
          >
            KCVV ELEWIJT
          </span>
          <Cta color={pal.dark ? TOKENS.ink : p.text} size={sq ? 24 : 30} />
        </div>
      </div>
    </Canvas>
  );
}

// ── B · Plakboek — cream paper, the photo taped on as a print ──────────────
function LookB({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const p = usePal();
  const sq = f === "square";
  const cs = unclash(s, p.ground);
  const tapeChip = (
    <span
      style={{
        display: "inline-block",
        background: cs.fill === TOKENS.cream ? TOKENS.jersey : cs.fill,
        color: cs.fill === TOKENS.cream ? TOKENS.ink : cs.onFill,
        transform: "rotate(-1deg)",
        boxShadow: `6px 6px 0 ${TOKENS.ink}`,
        padding: sq ? "10px 22px" : "14px 30px",
        fontFamily: MONO_FONT,
        fontWeight: 700,
        fontSize: sq ? 26 : 34,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        alignSelf: "flex-start",
      }}
    >
      {s.label}
    </span>
  );
  const print = (w: number, h: number | string, rot: number) => (
    <div
      {...mv("Foto-print", "3")}
      style={{
        position: "relative",
        width: w,
        height: h,
        background: "#fff",
        padding: 22,
        transform: `rotate(${rot}deg)`,
        boxShadow: "0 18px 40px rgba(10,10,10,0.25)",
        flexShrink: 0,
      }}
    >
      <Tape color={TOKENS.warm} rotate={-8} style={{ top: -26, left: 40 }} />
      <Tape
        color={TOKENS.creamDeep}
        rotate={6}
        style={{ top: -26, right: 40 }}
      />
      <Img src={photo(it, w - 44, typeof h === "number" ? h - 44 : 1100)} />
    </div>
  );
  if (sq)
    return (
      <Canvas f={f} bg={p.ground}>
        <Grain />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            gap: 48,
            padding: "72px 64px",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {print(500, 640, -2.5)}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div
              {...mv("Tekst", "2")}
              style={{ display: "flex", flexDirection: "column", gap: 28 }}
            >
              <div {...mv("Label", "1")} style={{ alignSelf: "flex-start" }}>
                {tapeChip}
              </div>
              {it.match && (
                <div {...mv("Uitslag / logo's", "1")}>
                  <Hero it={it} color={p.text} size={0.45} />
                </div>
              )}
              <div {...mv("Detail", "1")}>
                <Accent it={it} s={s} color={p.accent} size={0.55} />
              </div>
              <div {...mv("Titel", "1")}>
                <Title it={it} size={66} color={p.text} accent={p.accent} />
              </div>
              <div {...mv("Info", "1")}>
                <Meta it={it} color={p.soft} size={24} />
              </div>
            </div>
            <div
              {...pin("Clublogo + website")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 12,
              }}
            >
              <Crest size={64} />
              <Cta color={p.accent} size={20} />
            </div>
          </div>
        </div>
      </Canvas>
    );
  return (
    <Canvas f={f} bg={p.ground}>
      <Grain />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "72px 72px 80px",
          gap: 40,
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div {...mv("Label", "1 2")}>{tapeChip}</div>
          <div {...pin("Clublogo")}>
            <Crest size={104} />
          </div>
        </div>
        <div {...mv("Titel", "1 2")}>
          <Title it={it} size={112} color={p.text} accent={p.accent} />
        </div>
        {it.match && (
          <div {...mv("Uitslag / logo's", "1 2")}>
            <Hero it={it} color={p.text} size={0.8} />
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 24,
            flex: 1,
            minHeight: 0,
            padding: "0 0 24px",
          }}
        >
          {print(880, "100%", -2)}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            {...mv("Info + detail", "2")}
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div {...mv("Info", "1")}>
              <Meta it={it} color={p.soft} size={32} />
            </div>
            {s.accent !== "quote" && s.accent !== "none" && (
              <div {...mv("Detail", "1")}>
                <Accent it={it} s={s} color={p.accent} size={0.7} />
              </div>
            )}
          </div>
          <div {...pin("Voet")}>
            <RuleKicker text="kcvvelewijt.be" color={p.accent} size={30} />
          </div>
        </div>
      </div>
    </Canvas>
  );
}

// ── C · Affiche — full-bleed photo, bottom wash, seam + footer band ────────
function LookC({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const p = usePal();
  // #3511: Licht = cream wash + ink text, Donker = jersey-deep wash + cream.
  const w = washRgb(p.dark);
  const wash = useContext(WashCtx);
  const sq = f === "square";
  const footH = sq ? 88 : 120;
  return (
    <Canvas f={f} bg={TOKENS.jerseyDeepDark}>
      <div
        {...pin("Foto")}
        style={{ position: "absolute", inset: 0, bottom: footH }}
      >
        <ImgRaw
          src={photo(it, W, H[f] - footH)}
          style={{ filter: "sepia(0.25) saturate(0.9) contrast(1.05)" }}
        />
      </div>
      <Grain />
      <div
        style={{
          position: "absolute",
          inset: 0,
          bottom: footH,
          background: wash
            ? wash(w)
            : `linear-gradient(180deg, rgba(${w},0.6) 0%, rgba(${w},0) 20%, rgba(${w},0.15) 45%, rgba(${w},0.82) 72%, rgba(${w},0.95) 100%)`,
          zIndex: 1,
        }}
      />
      <div
        {...pin("Clublogo")}
        style={{
          position: "absolute",
          top: sq ? 48 : 64,
          left: sq ? 56 : 72,
          zIndex: 2,
        }}
      >
        <Crest size={sq ? 84 : 112} />
      </div>
      {s.accent !== "quote" && s.accent !== "none" && (
        <div
          {...mv("Detail", "1 2 3")}
          style={{
            position: "absolute",
            top: sq ? 56 : 72,
            right: sq ? 56 : 72,
            zIndex: 2,
          }}
        >
          <div
            style={{
              background: `rgba(${w},0.88)`,
              padding: sq ? "10px 16px" : "16px 24px",
            }}
          >
            <Accent
              it={it}
              s={s}
              color={p.dark ? TOKENS.cream : TOKENS.ink}
              size={sq ? 0.6 : 0.85}
            />
          </div>
        </div>
      )}
      <div
        {...mv("Hele tekstblok", "3")}
        style={{
          position: "absolute",
          left: sq ? 56 : 72,
          right: sq ? 56 : 72,
          bottom: footH + (sq ? 56 : 88),
          display: "flex",
          flexDirection: "column",
          gap: sq ? 22 : 34,
          zIndex: 2,
        }}
      >
        {it.match && (
          <div {...mv("Uitslag / logo's", "1 2")}>
            <Hero
              it={it}
              color={p.dark ? TOKENS.cream : TOKENS.ink}
              size={sq ? 0.55 : 0.85}
            />
          </div>
        )}
        <div
          {...mv("Tekst", "2")}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: sq ? 22 : 34,
          }}
        >
          {s.accent === "quote" && (
            <div {...mv("Aanhalingsteken", "1")}>
              <Accent it={it} s={s} color={p.accent} size={sq ? 0.6 : 1} />
            </div>
          )}
          <span
            {...mv("Label", "1")}
            style={{
              alignSelf: "flex-start",
              background: s.fill,
              color: s.onFill,
              border:
                s.fill === TOKENS.cream ? `4px solid ${TOKENS.ink}` : "none",
              padding: sq ? "10px 20px" : "14px 28px",
              fontFamily: MONO_FONT,
              fontWeight: 700,
              fontSize: sq ? 26 : 34,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {s.label}
          </span>
          <div {...mv("Titel", "1")}>
            <Title
              it={it}
              size={sq ? 84 : 124}
              color={p.dark ? TOKENS.cream : TOKENS.ink}
              accent={p.accent}
            />
          </div>
          <div {...mv("Info", "1")}>
            <Meta
              it={it}
              color={p.dark ? "rgba(245,241,230,0.88)" : TOKENS.inkSoft}
              size={sq ? 26 : 34}
            />
          </div>
        </div>
      </div>
      <div
        {...pin("Streep")}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: footH,
          zIndex: 2,
        }}
      >
        <Seam id={`c-seam-${it.key}-${f}`} h={sq ? 20 : 28} />
      </div>
      <div
        {...pin("Voet")}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: footH,
          background: TOKENS.jerseyDeep,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: sq ? "0 56px" : "0 72px",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: MONO_FONT,
            fontWeight: 700,
            fontSize: sq ? 22 : 28,
            letterSpacing: "0.16em",
            color: TOKENS.cream,
          }}
        >
          KCVV ELEWIJT
        </span>
        <Cta color={TOKENS.cream} size={sq ? 22 : 28} />
      </div>
    </Canvas>
  );
}

// ── D · Kleurvlak — the type's colour owns half, seam, photo the other ─────
export function LookD({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const sq = f === "square";
  const ground = s.fill === TOKENS.cream ? TOKENS.creamSoft : s.fill;
  const ink = s.fill === TOKENS.cream ? TOKENS.ink : s.onFill;
  const ghost = (
    <span
      style={{
        position: "absolute",
        fontFamily: DISPLAY_FONT,
        fontStyle: "italic",
        fontWeight: 900,
        fontSize: sq ? 260 : 340,
        lineHeight: 0.8,
        color: ink,
        opacity: 0.07,
        whiteSpace: "nowrap",
        left: -20,
        bottom: sq ? -30 : 10,
        pointerEvents: "none",
      }}
    >
      {s.label}
    </span>
  );
  const text = (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: sq ? 24 : 36,
        height: "100%",
        padding: sq ? "56px 48px" : "72px 72px 64px",
        overflow: "hidden",
      }}
    >
      {ghost}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
        }}
      >
        <Crest size={sq ? 76 : 104} />
        {s.accent !== "none" && s.accent !== "quote" && (
          <Accent it={it} s={s} color={ink} size={sq ? 0.5 : 0.8} />
        )}
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: sq ? 20 : 32,
          position: "relative",
        }}
      >
        {s.accent === "quote" && (
          <Accent it={it} s={s} color={TOKENS.warm} size={sq ? 0.5 : 0.9} />
        )}
        <RuleKicker text={s.label} color={ink} size={sq ? 22 : 30} />
        <Title it={it} size={sq ? 62 : 108} color={ink} />
        <Meta it={it} color={ink} size={sq ? 22 : 30} />
      </div>
    </div>
  );
  if (sq)
    return (
      <Canvas f={f} bg={ground}>
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div style={{ width: 560, height: "100%" }}>{text}</div>
          <Seam
            id={`d-seam-${it.key}-${f}`}
            h={24}
            vertical
            a={TOKENS.cream}
            b={TOKENS.ink}
          />
          <div style={{ flex: 1, position: "relative" }}>
            <Img src={photo(it, 496, 1080)} />
            <span
              style={{
                position: "absolute",
                bottom: 40,
                right: 32,
                background: TOKENS.ink,
                color: TOKENS.cream,
                padding: "10px 18px",
                fontFamily: MONO_FONT,
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "0.12em",
              }}
            >
              KCVVELEWIJT.BE
            </span>
          </div>
        </div>
      </Canvas>
    );
  return (
    <Canvas f={f} bg={ground}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ height: 1000 }}>{text}</div>
        <Seam
          id={`d-seam-${it.key}-${f}`}
          h={40}
          a={TOKENS.cream}
          b={TOKENS.ink}
        />
        <div style={{ flex: 1, position: "relative" }}>
          <Img src={photo(it, W, 880)} />
          <span
            style={{
              position: "absolute",
              bottom: 64,
              right: 64,
              background: TOKENS.ink,
              color: TOKENS.cream,
              padding: "16px 28px",
              fontFamily: MONO_FONT,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "0.12em",
              transform: "rotate(-2deg)",
              boxShadow: `6px 6px 0 ${TOKENS.jerseyDeep}`,
            }}
          >
            MEER OP KCVVELEWIJT.BE
          </span>
        </div>
      </div>
    </Canvas>
  );
}

// ── E · Ticket — a stub on a pitch-dark ground, date as the hero ───────────
function LookE({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const p = usePal();
  // Ticket and ground swap places in Donker so the ticket still stands out.
  const ground = p.dark ? TOKENS.cream : TOKENS.jerseyDeepDark;
  const ticket = p.dark ? TOKENS.jerseyDeepDark : TOKENS.cream;
  const tText = p.dark ? TOKENS.cream : TOKENS.ink;
  const sq = f === "square";
  const { day, month } = dayMonth(it);
  const perf = (
    <div
      style={{
        height: 0,
        borderTop: `5px dashed ${tText}`,
      }}
    />
  );
  const stub = (
    <div
      style={{
        display: "flex",
        gap: sq ? 28 : 40,
        padding: sq ? "28px 36px" : "48px 48px 40px",
        alignItems: "flex-start",
      }}
    >
      {it.match && (
        <div {...mv("Uitslag / logo's", "1 2")}>
          <Hero it={it} color={tText} size={sq ? 0.42 : 0.6} />
        </div>
      )}
      {isEventish(it) && !it.match && (
        <div
          {...mv("Datumblok", "1 2")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: s.fill === TOKENS.cream ? TOKENS.ink : s.fill,
            color: s.fill === TOKENS.cream ? TOKENS.cream : s.onFill,
            padding: sq ? "12px 20px" : "20px 28px",
            minWidth: sq ? 130 : 190,
          }}
        >
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 900,
              fontSize: sq ? 88 : 140,
              lineHeight: 0.9,
            }}
          >
            {day}
          </span>
          <span
            style={{
              fontFamily: MONO_FONT,
              fontWeight: 700,
              fontSize: sq ? 24 : 36,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {month}
          </span>
        </div>
      )}
      <div
        {...mv("Tekst", "2")}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: sq ? 12 : 20,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          {...mv("Kicker", "1")}
          style={{
            fontFamily: MONO_FONT,
            fontWeight: 700,
            fontSize: sq ? 22 : 30,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: p.accent,
          }}
        >
          {it.match ? kickerText(it, s) : s.label}
          {s.accent === "quote" ? " · “…”" : ""}
        </span>
        <div {...mv("Titel", "1")}>
          <Title it={it} size={sq ? 54 : 84} color={tText} accent={p.accent} />
        </div>
        {hasMeta(it) && (
          <div {...mv("Info", "1")}>
            <Meta
              it={it}
              color={p.dark ? p.soft : TOKENS.inkSoft}
              size={sq ? 20 : 28}
            />
          </div>
        )}
      </div>
    </div>
  );
  return (
    <Canvas f={f} bg={ground}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(90deg, ${p.dark ? "rgba(10,10,10,0.04)" : "rgba(245,241,230,0.05)"} 0 84px, transparent 84px 168px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: sq ? "40px 72px" : "80px 72px",
          gap: sq ? 24 : 48,
        }}
      >
        <div
          {...pin("Kop")}
          style={{ display: "flex", alignItems: "center", gap: 20 }}
        >
          <Crest size={sq ? 64 : 96} />
          <span
            style={{
              fontFamily: MONO_FONT,
              fontWeight: 700,
              fontSize: sq ? 22 : 30,
              letterSpacing: "0.2em",
              color: p.dark ? TOKENS.ink : TOKENS.cream,
            }}
          >
            KCVV ELEWIJT
          </span>
        </div>
        <div
          {...mv("Ticket (alles erin)", "3")}
          style={{
            width: "100%",
            background: ticket,
            border: `5px solid ${TOKENS.ink}`,
            boxShadow: `14px 14px 0 ${p.dark ? TOKENS.jerseyDeep : TOKENS.ink}`,
            display: "flex",
            flexDirection: "column",
            transform: "rotate(-1.2deg)",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            {...pin("Foto")}
            style={{
              flex: 1,
              minHeight: sq ? 300 : 700,
              borderBottom: `5px solid ${TOKENS.ink}`,
              position: "relative",
            }}
          >
            <Img src={photo(it, 940, sq ? 600 : 1200)} />
          </div>
          {stub}
          {perf}
          <div
            {...pin("Ticketvoet")}
            style={{
              padding: sq ? "16px 36px" : "28px 48px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: MONO_FONT,
                fontWeight: 700,
                fontSize: sq ? 20 : 28,
                letterSpacing: "0.14em",
                color: tText,
              }}
            >
              KCVVELEWIJT.BE
            </span>
          </div>
        </div>
      </div>
    </Canvas>
  );
}

export const LOOKS: Record<
  string,
  { name: string; C: (p: { it: LookItem; f: Format }) => React.ReactElement }
> = {
  A: { name: "Kaart", C: LookA },
  B: { name: "Plakboek", C: LookB },
  C: { name: "Affiche", C: LookC },
  // D · Kleurvlak — rejected by the owner (2026-10-17), kept on the branch only.
  E: { name: "Ticket", C: LookE },
};
const KEYS = Object.keys(LOOKS);

function itemLabel(it: LookItem): string {
  if (it.draft) return `Draft ${it.draft}`;
  if (it.kind === "event")
    return `Event (${it.eventType})${it.img ? "" : " — geen cover, fallback"}`;
  return ARTICLE_STYLE[it.articleType ?? ""]?.label ?? "Artikel";
}

function Tile({
  it,
  f,
  variant,
}: {
  it: LookItem;
  f: Format;
  variant: string;
}) {
  const scale = f === "story" ? 0.3 : 0.3;
  const Look = LOOKS[variant]!.C;
  const theme = useContext(ThemeCtx);
  const id = `look-${variant}-${theme}-${it.key}-${f}`;
  async function save() {
    const node = document.getElementById(id);
    if (!node) return;
    const url = await toPng(node, {
      width: W,
      height: H[f],
      pixelRatio: 1,
      includeQueryParams: true,
      cacheBust: true,
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.png`;
    a.click();
  }
  return (
    <figure
      style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}
    >
      <figcaption
        style={{
          fontFamily: MONO_FONT,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>
          {itemLabel(it)} · {f}
        </span>
        <button
          type="button"
          onClick={save}
          style={{ textDecoration: "underline", cursor: "pointer" }}
        >
          png
        </button>
      </figcaption>
      <div
        style={{
          width: W * scale,
          height: H[f] * scale,
          overflow: "hidden",
          border: `1px solid ${TOKENS.paperEdge}`,
        }}
      >
        <div
          style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <div id={id}>
            <Look it={it} f={f} />
          </div>
        </div>
      </div>
    </figure>
  );
}

export function LooksPrototype({
  variant,
  items,
}: {
  variant: string;
  items: LookItem[];
}) {
  const router = useRouter();
  const v = LOOKS[variant] ? variant : "A";
  const [format, setFormat] = useState<Format>("story");
  const [theme, setTheme] = useState<Theme>("light");
  const go = (d: number) => {
    const next = KEYS[(KEYS.indexOf(v) + d + KEYS.length) % KEYS.length]!;
    const q = new URLSearchParams(window.location.search);
    q.set("variant", next);
    router.replace(`?${q}`, { scroll: false });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      style={{
        padding: "32px 16px 120px",
        background: TOKENS.cream,
        minHeight: "100vh",
      }}
    >
      <p style={{ fontFamily: MONO_FONT, fontSize: 13, marginBottom: 16 }}>
        PROTOTYPE #3509 — look {v} · {LOOKS[v]!.name}. Real Sanity content:
        newest article per type with a cover, newest event with and without
        cover.
      </p>
      <ThemeCtx.Provider value={theme}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {items.map((it) => (
            <Tile
              key={`${v}-${it.key}-${format}`}
              it={it}
              f={format}
              variant={v}
            />
          ))}
        </div>
      </ThemeCtx.Provider>
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#111",
          color: "#fff",
          padding: "8px 10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          fontFamily: MONO_FONT,
          fontSize: 14,
        }}
      >
        <button
          type="button"
          onClick={() => go(-1)}
          style={{ padding: "10px 14px", cursor: "pointer" }}
          aria-label="Vorige look"
        >
          ←
        </button>
        <span style={{ minWidth: 150, textAlign: "center" }}>
          {v} · {LOOKS[v]!.name}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          style={{ padding: "10px 14px", cursor: "pointer" }}
          aria-label="Volgende look"
        >
          →
        </button>
        <span
          style={{ width: 1, height: 24, background: "#555", margin: "0 6px" }}
        />
        {(["story", "square"] as const).map((x) => (
          <button
            key={x}
            type="button"
            onClick={() => setFormat(x)}
            style={{
              padding: "10px 12px",
              cursor: "pointer",
              background: format === x ? "#fff" : "transparent",
              color: format === x ? "#111" : "#fff",
            }}
          >
            {x === "story" ? "9:16" : "1:1"}
          </button>
        ))}
        <span
          style={{ width: 1, height: 24, background: "#555", margin: "0 6px" }}
        />
        {(["light", "dark"] as const).map((x) => (
          <button
            key={x}
            type="button"
            onClick={() => setTheme(x)}
            style={{
              padding: "10px 12px",
              cursor: "pointer",
              background: theme === x ? "#fff" : "transparent",
              color: theme === x ? "#111" : "#fff",
            }}
          >
            {x === "light" ? "Licht" : "Donker"}
          </button>
        ))}
      </div>
    </div>
  );
}
