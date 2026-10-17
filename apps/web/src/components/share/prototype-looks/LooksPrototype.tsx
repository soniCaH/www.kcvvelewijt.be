"use client";

// PROTOTYPE (#3509) — throwaway. Answers: which look family wins for news and
// event stories, how each of the six article types differs inside it, how an
// event shows its eventType, and how a no-cover event looks with the fallback.
// Five structurally different families, A..E, each as story (1080×1920) and
// square (1080×1080), on real Sanity content. Inline styles on purpose: the
// real templates are captured with html-to-image, so this keeps that shape.

import { useEffect, useState } from "react";
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
  kind: "article" | "event";
  articleType?: string;
  eventType?: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  img: string | null;
  hx: number;
  hy: number;
}

type Format = "story" | "square";
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
function styleOf(it: LookItem): TypeStyle {
  return it.kind === "event"
    ? (EVENT_STYLE[it.eventType ?? "Andere"] ?? EVENT_STYLE.Andere!)
    : (ARTICLE_STYLE[it.articleType ?? "announcement"] ??
        ARTICLE_STYLE.announcement!);
}

// ── Data helpers ───────────────────────────────────────────────────────────
function photo(it: LookItem, w: number, h: number): string {
  if (!it.img) return FALLBACK;
  const src = `${it.img}?w=${w}&h=${h}&q=80&fit=crop&crop=focalpoint&fp-x=${it.hx}&fp-y=${it.hy}`;
  // Same-origin via the Next image optimizer — what SharePage does for capture.
  return `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
}
const isEventish = (it: LookItem) =>
  it.kind === "event" || it.articleType === "event";
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
  return [
    dateLine(it),
    timeLine(it),
    isEventish(it) ? it.location : null,
  ].filter((x): x is string => Boolean(x));
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
  text,
  size,
  color,
  maxWidth,
}: {
  text: string;
  size: number;
  color: string;
  maxWidth?: number;
}) {
  return (
    <h1
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        fontSize: titleSize(text, size),
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
      {text}
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
        lineHeight: 1.4,
      }}
    >
      {metaParts(it).join(" · ")}
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
      Lees meer · link in bio →
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
function Img({ src, style }: { src: string; style?: React.CSSProperties }) {
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

// ── A · Kaart — photo up top, a ClippedCard laid over its edge ─────────────
function LookA({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const sq = f === "square";
  const photoH = sq ? 600 : 1240;
  const bracket = (pos: "tl" | "br"): React.CSSProperties => ({
    position: "absolute",
    width: 44,
    height: 44,
    border: `5px solid ${TOKENS.ink}`,
    ...(pos === "tl"
      ? { top: -18, left: -18, borderRight: 0, borderBottom: 0 }
      : { bottom: -18, right: -18, borderLeft: 0, borderTop: 0 }),
  });
  return (
    <Canvas f={f} bg={TOKENS.cream}>
      <Grain />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: photoH,
        }}
      >
        <Img src={photo(it, W, photoH)} />
      </div>
      <div style={{ position: "absolute", top: 56, left: 64, zIndex: 2 }}>
        <Crest size={sq ? 84 : 104} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: photoH - (sq ? 170 : 200),
          background: "#fff",
          border: `5px solid ${TOKENS.ink}`,
          boxShadow: `16px 16px 0 ${TOKENS.ink}`,
          padding: sq ? "64px 56px 48px" : "88px 64px 64px",
          display: "flex",
          flexDirection: "column",
          gap: sq ? 24 : 36,
          zIndex: 2,
        }}
      >
        <span style={bracket("tl")} />
        <span style={bracket("br")} />
        <Stamp
          s={s}
          size={sq ? 28 : 34}
          style={{ position: "absolute", top: -30, right: 56 }}
        />
        {s.accent === "quote" && (
          <Accent it={it} s={s} color={TOKENS.jerseyDeep} size={sq ? 0.6 : 1} />
        )}
        <RuleKicker
          text={dateLine(it) || s.label}
          color={TOKENS.jerseyDeep}
          size={sq ? 26 : 30}
        />
        <Title text={it.title} size={sq ? 76 : 100} color={TOKENS.ink} />
        {isEventish(it) && (
          <Meta it={it} color={TOKENS.inkSoft} size={sq ? 26 : 32} />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: sq ? 40 : 72,
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
            color: TOKENS.inkMuted,
          }}
        >
          KCVV ELEWIJT
        </span>
        <Cta color={TOKENS.ink} size={sq ? 24 : 30} />
      </div>
    </Canvas>
  );
}

// ── B · Plakboek — cream paper, the photo taped on as a print ──────────────
function LookB({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const sq = f === "square";
  const tapeChip = (
    <span
      style={{
        display: "inline-block",
        background: s.fill === TOKENS.cream ? TOKENS.jersey : s.fill,
        color: s.fill === TOKENS.cream ? TOKENS.ink : s.onFill,
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
  const print = (w: number, h: number, rot: number) => (
    <div
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
      <Img src={photo(it, w - 44, h - 44)} />
    </div>
  );
  if (sq)
    return (
      <Canvas f={f} bg={TOKENS.cream}>
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
            {tapeChip}
            <Accent it={it} s={s} color={TOKENS.jerseyDeep} size={0.55} />
            <Title text={it.title} size={66} color={TOKENS.ink} />
            <Meta it={it} color={TOKENS.inkSoft} size={24} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 12,
              }}
            >
              <Crest size={64} />
              <Cta color={TOKENS.jerseyDeep} size={20} />
            </div>
          </div>
        </div>
      </Canvas>
    );
  return (
    <Canvas f={f} bg={TOKENS.cream}>
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
          {tapeChip}
          <Crest size={104} />
        </div>
        <Title text={it.title} size={112} color={TOKENS.ink} />
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 24 }}
        >
          {print(860, 860, -2)}
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <Meta it={it} color={TOKENS.inkSoft} size={32} />
            {s.accent !== "quote" && (
              <Accent it={it} s={s} color={TOKENS.jerseyDeep} size={0.7} />
            )}
          </div>
          <RuleKicker text="Link in bio" color={TOKENS.jerseyDeep} size={30} />
        </div>
      </div>
    </Canvas>
  );
}

// ── C · Affiche — full-bleed photo, bottom wash, seam + footer band ────────
function LookC({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const sq = f === "square";
  const footH = sq ? 88 : 120;
  return (
    <Canvas f={f} bg={TOKENS.jerseyDeepDark}>
      <div style={{ position: "absolute", inset: 0, bottom: footH }}>
        <Img
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
          background:
            "linear-gradient(180deg, rgba(8,26,18,0.25) 0%, rgba(8,26,18,0) 22%, rgba(8,26,18,0.15) 45%, rgba(8,26,18,0.82) 72%, rgba(8,26,18,0.95) 100%)",
          zIndex: 1,
        }}
      />
      <div
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
          style={{
            position: "absolute",
            top: sq ? 56 : 72,
            right: sq ? 56 : 72,
            zIndex: 2,
          }}
        >
          <Accent it={it} s={s} color={TOKENS.cream} size={sq ? 0.6 : 0.85} />
        </div>
      )}
      <div
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
        {s.accent === "quote" && (
          <Accent it={it} s={s} color={TOKENS.warm} size={sq ? 0.6 : 1} />
        )}
        <span
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
        <Title text={it.title} size={sq ? 84 : 124} color={TOKENS.cream} />
        <Meta it={it} color="rgba(245,241,230,0.88)" size={sq ? 26 : 34} />
      </div>
      <div
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
          KCVVELEWIJT.BE
        </span>
        <Cta color={TOKENS.cream} size={sq ? 22 : 28} />
      </div>
    </Canvas>
  );
}

// ── D · Kleurvlak — the type's colour owns half, seam, photo the other ─────
function LookD({ it, f }: { it: LookItem; f: Format }) {
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
        <Title text={it.title} size={sq ? 62 : 108} color={ink} />
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
              LINK IN BIO →
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
            LEES MEER · LINK IN BIO →
          </span>
        </div>
      </div>
    </Canvas>
  );
}

// ── E · Ticket — a stub on a pitch-dark ground, date as the hero ───────────
function LookE({ it, f }: { it: LookItem; f: Format }) {
  const s = styleOf(it);
  const sq = f === "square";
  const { day, month } = dayMonth(it);
  const perf = (
    <div
      style={{
        position: "relative",
        height: 0,
        borderTop: `5px dashed ${TOKENS.ink}`,
        margin: "0 0",
      }}
    >
      {/* Square notches — the site has no rounded corners. */}
      <span
        style={{
          position: "absolute",
          left: -34,
          top: -22,
          width: 36,
          height: 36,
          background: TOKENS.jerseyDeepDark,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: -34,
          top: -22,
          width: 36,
          height: 36,
          background: TOKENS.jerseyDeepDark,
        }}
      />
    </div>
  );
  const stub = (
    <div
      style={{
        display: "flex",
        gap: sq ? 28 : 40,
        padding: sq ? "28px 36px" : "48px 48px 40px",
        alignItems: "stretch",
      }}
    >
      <div
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: sq ? 12 : 20,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: MONO_FONT,
            fontWeight: 700,
            fontSize: sq ? 22 : 30,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: TOKENS.jerseyDeep,
          }}
        >
          {s.label}
          {s.accent === "quote" ? " · “…”" : ""}
        </span>
        <Title text={it.title} size={sq ? 54 : 84} color={TOKENS.ink} />
        {isEventish(it) && (
          <Meta it={it} color={TOKENS.inkSoft} size={sq ? 20 : 28} />
        )}
      </div>
    </div>
  );
  return (
    <Canvas f={f} bg={TOKENS.jerseyDeepDark}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(245,241,230,0.05) 0 84px, transparent 84px 168px)",
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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Crest size={sq ? 64 : 96} />
          <span
            style={{
              fontFamily: MONO_FONT,
              fontWeight: 700,
              fontSize: sq ? 22 : 30,
              letterSpacing: "0.2em",
              color: TOKENS.cream,
            }}
          >
            KCVV ELEWIJT
          </span>
        </div>
        <div
          style={{
            width: "100%",
            background: TOKENS.cream,
            border: `5px solid ${TOKENS.ink}`,
            boxShadow: `14px 14px 0 ${TOKENS.ink}`,
            display: "flex",
            flexDirection: "column",
            transform: "rotate(-1.2deg)",
            flex: sq ? 1 : undefined,
          }}
        >
          <div
            style={{
              height: sq ? 400 : 900,
              borderBottom: `5px solid ${TOKENS.ink}`,
              position: "relative",
            }}
          >
            <Img src={photo(it, 940, sq ? 400 : 900)} />
          </div>
          {stub}
          {perf}
          <div
            style={{
              padding: sq ? "16px 36px" : "28px 48px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: MONO_FONT,
                fontWeight: 700,
                fontSize: sq ? 20 : 28,
                letterSpacing: "0.14em",
                color: TOKENS.inkMuted,
              }}
            >
              {isEventish(it) ? "TOEGANG" : "LEES MEER"}
            </span>
            <span
              style={{
                fontFamily: MONO_FONT,
                fontWeight: 700,
                fontSize: sq ? 20 : 28,
                letterSpacing: "0.14em",
                color: TOKENS.ink,
              }}
            >
              LINK IN BIO →
            </span>
          </div>
        </div>
      </div>
    </Canvas>
  );
}

const LOOKS: Record<
  string,
  { name: string; C: (p: { it: LookItem; f: Format }) => React.ReactElement }
> = {
  A: { name: "Kaart", C: LookA },
  B: { name: "Plakboek", C: LookB },
  C: { name: "Affiche", C: LookC },
  D: { name: "Kleurvlak", C: LookD },
  E: { name: "Ticket", C: LookE },
};
const KEYS = Object.keys(LOOKS);

function itemLabel(it: LookItem): string {
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
  const id = `look-${variant}-${it.key}-${f}`;
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
  const go = (d: number) => {
    const next = KEYS[(KEYS.indexOf(v) + d + KEYS.length) % KEYS.length]!;
    router.replace(`?variant=${next}`, { scroll: false });
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
      </div>
    </div>
  );
}
