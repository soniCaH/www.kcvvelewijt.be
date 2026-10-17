"use client";

// PROTOTYPE (#3511) — throwaway. Answers: what does a LIGHT theme look like on
// a photo story, is the light/dark switch per story or per block (blocks move
// freely since #3508), bottom-weighted vs even overlay, and overlay vs a plate
// behind each block. Self-contained on purpose: ShareFrame hard-wires the dark
// image palette, and the point here is to try other ones.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import {
  BODY_FONT,
  CAPTURE_HEIGHT,
  CAPTURE_WIDTH,
  DISPLAY_FONT,
  GRAIN_DATA_URL,
  KCVV_LOGO,
  MONO_FONT,
  TOKENS,
} from "../constants";

// ── Fixture: a news story (#3506 — kicker, title, date, "link in bio") ─────
const PHOTOS = [
  {
    label: "Licht — clubhuis, witte gevel",
    src: "/images/word-lid-trainer.jpg",
  },
  {
    label: "Donker — groene shirts op kunstgras",
    src: "/images/kalender-matchday.jpg",
  },
  {
    label: "Gemengd — huddle tegen de lucht",
    src: "/images/identity-huddle.jpg",
  },
];

type BlockId = "kicker" | "title" | "date" | "cta";
const BLOCKS: BlockId[] = ["kicker", "title", "date", "cta"];
const LABELS: Record<BlockId, string> = {
  kicker: "Kicker",
  title: "Titel",
  date: "Datum",
  cta: "Link in bio",
};

type Theme = "light" | "dark";

interface Palette {
  text: string;
  kicker: string;
  muted: string;
}
const PALETTE: Record<Theme, Palette> = {
  light: { text: TOKENS.ink, kicker: TOKENS.jerseyDeep, muted: "#3a3a3a" },
  dark: {
    text: TOKENS.cream,
    kicker: TOKENS.warm,
    muted: "rgba(245,241,230,0.86)",
  },
};
// Wash colour per theme: cream for light, the existing jersey-deep for dark.
const WASH: Record<Theme, string> = {
  light: "245,241,230",
  dark: "8,26,18",
};

function Block({ id, palette }: { id: BlockId; palette: Palette }) {
  switch (id) {
    case "kicker":
      return (
        <span
          style={{
            fontFamily: MONO_FONT,
            fontSize: 42,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: palette.kicker,
          }}
        >
          Interview
        </span>
      );
    case "title":
      return (
        <h1
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 900,
            fontSize: 112,
            lineHeight: 0.92,
            letterSpacing: "-0.015em",
            margin: 0,
            maxWidth: 900,
            color: palette.text,
          }}
        >
          Onze U13 wint het tornooi van{" "}
          <span style={{ fontStyle: "italic", color: palette.kicker }}>
            Zemst
          </span>
        </h1>
      );
    case "date":
      return (
        <span
          style={{
            fontFamily: MONO_FONT,
            fontSize: 40,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: palette.muted,
          }}
        >
          Zaterdag 18 oktober 2026
        </span>
      );
    case "cta":
      return (
        <span
          style={{
            fontFamily: MONO_FONT,
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: palette.text,
          }}
        >
          Lees meer · link in bio
        </span>
      );
  }
}

// ── Frame: photo backdrop + optional wash + pinned crest/footer ────────────
function PhotoFrame({
  photo,
  wash,
  footTheme,
  children,
}: {
  photo: string;
  wash?: string;
  footTheme: Theme;
  children: React.ReactNode;
}) {
  const foot = PALETTE[footTheme];
  return (
    <div
      style={{
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        position: "relative",
        overflow: "hidden",
        background: TOKENS.jerseyDeepDark,
        fontFamily: BODY_FONT,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "sepia(0.32) saturate(0.85) contrast(1.05)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: GRAIN_DATA_URL,
          mixBlendMode: "multiply",
        }}
      />
      {wash && (
        <div style={{ position: "absolute", inset: 0, background: wash }} />
      )}
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px 56px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={KCVV_LOGO}
          alt="KCVV Elewijt"
          style={{ width: 96, height: 96 }}
        />
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            gap: 36,
            paddingBottom: 72,
          }}
        >
          {children}
        </div>
        <span
          style={{
            alignSelf: "flex-end",
            fontFamily: MONO_FONT,
            fontSize: 40,
            letterSpacing: "0.08em",
            color: foot.text,
          }}
        >
          KCVVELEWIJT.BE
        </span>
      </div>
    </div>
  );
}

// ── Free positioning (copied from #3508 variant C) ─────────────────────────
type Offsets = Record<BlockId, { x: number; y: number }>;
const ZERO: Offsets = {
  kicker: { x: 0, y: 0 },
  title: { x: 0, y: 0 },
  date: { x: 0, y: 0 },
  cta: { x: 0, y: 0 },
};

function useDrag(scale: number) {
  const [offsets, setOffsets] = useState(ZERO);
  const [dragging, setDragging] = useState<BlockId | null>(null);
  const start = useRef({ x: 0, y: 0, cx: 0, cy: 0 });
  const handlers = (id: BlockId) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { ...offsets[id], cx: e.clientX, cy: e.clientY };
      setDragging(id);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (dragging !== id) return;
      const s = start.current;
      setOffsets((o) => ({
        ...o,
        [id]: {
          x: s.x + (e.clientX - s.cx) / scale,
          y: s.y + (e.clientY - s.cy) / scale,
        },
      }));
    },
    onPointerUp: () => setDragging(null),
    onPointerCancel: () => setDragging(null),
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
  });
  const style = (id: BlockId): React.CSSProperties => ({
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    touchAction: "none",
    cursor: dragging === id ? "grabbing" : "grab",
    position: "relative",
    zIndex: dragging === id ? 2 : 1,
    transform: `translate(${offsets[id].x}px, ${offsets[id].y}px)`,
    outline: dragging === id ? "8px dashed #c0392b" : undefined,
    outlineOffset: 16,
  });
  return { offsets, reset: () => setOffsets(ZERO), handlers, style };
}

// ── Capture (copied from SharePage.handleGenerate) ─────────────────────────
function useCapture() {
  const ref = useRef<HTMLDivElement>(null);
  const [png, setPng] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generate = async () => {
    if (!ref.current) return;
    setError(null);
    try {
      const opts = {
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        pixelRatio: 1,
        includeQueryParams: true,
      };
      await toPng(ref.current, opts); // iOS warm-up, thrown away
      setPng(await toPng(ref.current, opts));
    } catch (e) {
      setError(String(e));
    }
  };
  return { ref, png, error, generate };
}

function useFitScale(max: number) {
  const [scale, setScale] = useState(max);
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(max, (window.innerWidth - 32) / CAPTURE_WIDTH));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [max]);
  return scale;
}

// ── Shared chrome: preview + photo picker + controls column ────────────────
function Workbench({
  render,
  controls,
  state,
}: {
  render: (args: {
    photo: string;
    drag: ReturnType<typeof useDrag>;
  }) => React.ReactNode;
  controls: React.ReactNode;
  state: unknown;
}) {
  const scale = useFitScale(0.4);
  const drag = useDrag(scale);
  const { ref: capRef, png, error, generate } = useCapture();
  const [photo, setPhoto] = useState(PHOTOS[0].src);
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex flex-col gap-2">
        <p className="max-w-[432px] font-mono text-xs">
          Sleep de tekstblokken waar je wil — ook naar boven, waar de foto het
          lichtst of het drukst is.
        </p>
        <div
          style={{
            width: CAPTURE_WIDTH * scale,
            height: CAPTURE_HEIGHT * scale,
            overflow: "hidden",
            flexShrink: 0,
          }}
          className="border-ink border-2"
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div ref={capRef}>{render({ photo, drag })}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={drag.reset}
          className="self-start font-mono text-sm underline"
        >
          Blokken terugzetten
        </button>
      </div>
      <div
        className="flex flex-col gap-4 font-mono text-sm"
        style={{ width: 324 }}
      >
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-semibold">Foto</legend>
          {PHOTOS.map((p) => (
            <label key={p.src} className="flex gap-2">
              <input
                type="radio"
                checked={photo === p.src}
                onChange={() => setPhoto(p.src)}
              />
              {p.label}
            </label>
          ))}
          <label className="mt-1 flex flex-col gap-1">
            Of upload je eigen foto:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhoto(URL.createObjectURL(f));
              }}
            />
          </label>
        </fieldset>
        {controls}
        <button
          type="button"
          onClick={generate}
          className="bg-ink text-cream px-4 py-2 uppercase"
        >
          Genereer PNG
        </button>
        {error && <p className="text-card-red text-xs">{error}</p>}
        {png && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={png}
            alt="Gegenereerde PNG"
            className="border-ink border-2"
          />
        )}
        <pre className="bg-ink/5 p-2 text-xs whitespace-pre-wrap">
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function ThemeToggle({
  value,
  onChange,
  label,
}: {
  value: Theme;
  onChange: (t: Theme) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1">{label}</span>
      {(["light", "dark"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`border-ink border-2 px-2 py-0.5 ${value === t ? "bg-ink text-cream" : ""}`}
        >
          {t === "light" ? "Licht" : "Donker"}
        </button>
      ))}
    </div>
  );
}

function PerBlockToggles({
  themes,
  setThemes,
}: {
  themes: Record<BlockId, Theme>;
  setThemes: (t: Record<BlockId, Theme>) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 font-semibold">Thema per blok</legend>
      {BLOCKS.map((id) => (
        <ThemeToggle
          key={id}
          label={LABELS[id]}
          value={themes[id]}
          onChange={(t) => setThemes({ ...themes, [id]: t })}
        />
      ))}
      <div className="mt-1 flex gap-3">
        {(["light", "dark"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className="underline"
            onClick={() => setThemes({ kicker: t, title: t, date: t, cta: t })}
          >
            Alles {t === "light" ? "licht" : "donker"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const ALL_DARK: Record<BlockId, Theme> = {
  kicker: "dark",
  title: "dark",
  date: "dark",
  cta: "dark",
};

// ── Variant A: one wash over the whole photo, switch per story ─────────────
function washGradient(theme: Theme, shape: "bottom" | "even", s: number) {
  const c = WASH[theme];
  return shape === "even"
    ? `rgba(${c},${(s * 0.8).toFixed(2)})`
    : `linear-gradient(180deg, rgba(${c},${(s * 0.45).toFixed(2)}) 0%, rgba(${c},${(s * 0.2).toFixed(2)}) 40%, rgba(${c},${s.toFixed(2)}) 100%)`;
}

function VariantA() {
  const [theme, setTheme] = useState<Theme>("light");
  const [shape, setShape] = useState<"bottom" | "even">("bottom");
  const [strength, setStrength] = useState(85);
  const s = strength / 100;
  return (
    <Workbench
      state={{ theme, shape, strength }}
      controls={
        <>
          <ThemeToggle
            label="Thema (hele story)"
            value={theme}
            onChange={setTheme}
          />
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 font-semibold">Verloop</legend>
            <label className="flex gap-2">
              <input
                type="radio"
                checked={shape === "bottom"}
                onChange={() => setShape("bottom")}
              />
              Onderaan sterk (zoals nu)
            </label>
            <label className="flex gap-2">
              <input
                type="radio"
                checked={shape === "even"}
                onChange={() => setShape("even")}
              />
              Overal even sterk
            </label>
          </fieldset>
          <label className="flex flex-col gap-1">
            Sterkte: {strength}%
            <input
              type="range"
              min={0}
              max={100}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
            />
          </label>
        </>
      }
      render={({ photo, drag }) => (
        <PhotoFrame
          photo={photo}
          wash={washGradient(theme, shape, s)}
          footTheme={theme}
        >
          {BLOCKS.map((id) => (
            <div key={id} {...drag.handlers(id)} style={drag.style(id)}>
              <Block id={id} palette={PALETTE[theme]} />
            </div>
          ))}
        </PhotoFrame>
      )}
    />
  );
}

// ── Variant B: no wash — a solid plate behind each block, switch per block ─
function VariantB() {
  const [themes, setThemes] = useState<Record<BlockId, Theme>>(ALL_DARK);
  const [opacity, setOpacity] = useState(100);
  const [foot, setFoot] = useState<Theme>("dark");
  return (
    <Workbench
      state={{ themes, plateOpacity: opacity, footer: foot }}
      controls={
        <>
          <PerBlockToggles themes={themes} setThemes={setThemes} />
          <label className="flex flex-col gap-1">
            Dekking plaat: {opacity}%
            <input
              type="range"
              min={40}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
          </label>
          <ThemeToggle
            label="Website onderaan"
            value={foot}
            onChange={setFoot}
          />
        </>
      }
      render={({ photo, drag }) => (
        <PhotoFrame photo={photo} footTheme={foot}>
          {BLOCKS.map((id) => {
            const t = themes[id];
            // Light plate = cream sheet; dark plate = the jersey-deep poster.
            const plate = t === "light" ? "245,241,230" : "19,61,40";
            return (
              <div key={id} {...drag.handlers(id)} style={drag.style(id)}>
                <div
                  style={{
                    background: `rgba(${plate},${opacity / 100})`,
                    padding: id === "title" ? "28px 36px 36px" : "14px 24px",
                  }}
                >
                  <Block id={id} palette={PALETTE[t]} />
                </div>
              </div>
            );
          })}
        </PhotoFrame>
      )}
    />
  );
}

// ── Variant C: no wash — a soft glow that travels with each block ──────────
function VariantC() {
  const [themes, setThemes] = useState<Record<BlockId, Theme>>(ALL_DARK);
  const [glow, setGlow] = useState(70);
  const [foot, setFoot] = useState<Theme>("dark");
  const a = (glow / 100).toFixed(2);
  return (
    <Workbench
      state={{ themes, glow, footer: foot }}
      controls={
        <>
          <PerBlockToggles themes={themes} setThemes={setThemes} />
          <label className="flex flex-col gap-1">
            Sterkte gloed: {glow}%
            <input
              type="range"
              min={20}
              max={100}
              value={glow}
              onChange={(e) => setGlow(Number(e.target.value))}
            />
          </label>
          <ThemeToggle
            label="Website onderaan"
            value={foot}
            onChange={setFoot}
          />
        </>
      }
      render={({ photo, drag }) => (
        <PhotoFrame photo={photo} footTheme={foot}>
          {BLOCKS.map((id) => {
            const t = themes[id];
            const c = WASH[t];
            return (
              <div key={id} {...drag.handlers(id)} style={drag.style(id)}>
                <div
                  style={{
                    background: `rgba(${c},${a})`,
                    boxShadow: `0 0 90px 60px rgba(${c},${a})`,
                  }}
                >
                  <Block id={id} palette={PALETTE[t]} />
                </div>
              </div>
            );
          })}
        </PhotoFrame>
      )}
    />
  );
}

// ── Switcher ───────────────────────────────────────────────────────────────
const VARIANTS = {
  A: { name: "Waas over de hele foto", C: VariantA },
  B: { name: "Plaat achter elk blok", C: VariantB },
  C: { name: "Gloed per blok", C: VariantC },
} as const;
type Key = keyof typeof VARIANTS;
const KEYS = Object.keys(VARIANTS) as Key[];

export function ThemePrototype({ variant }: { variant: string }) {
  const router = useRouter();
  const current: Key = (KEYS as string[]).includes(variant)
    ? (variant as Key)
    : "A";
  const go = (step: number) => {
    const i = (KEYS.indexOf(current) + step + KEYS.length) % KEYS.length;
    router.replace(`?variant=${KEYS[i]}`, { scroll: false });
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

  const Variant = VARIANTS[current].C;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-32">
      <h1 className="mb-6 font-mono text-lg">
        Prototype #3511 — licht en donker thema op een foto-story
      </h1>
      <Variant key={current} />
      <div className="bg-ink text-cream fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 px-5 py-3 font-mono text-sm shadow-xl">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Vorige variant"
        >
          ←
        </button>
        <span>
          {current} ({VARIANTS[current].name})
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Volgende variant"
        >
          →
        </button>
      </div>
    </main>
  );
}
