"use client";

// PROTOTYPE (#3522) — throwaway. Answers: the exact wash of Zacht / Normaal /
// Sterk for Licht and Donker, tuned on real club photos in every look, and
// whether one table fits all looks. ?variant= = what "stronger" means:
// 1 more cover (same height), 2 climbs higher (same cover), 3 both.
// Grid = photos × steps; tap a cell to see it big. Sliders tune live; the
// table at the bottom is the answer to copy. Nothing is stored.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MONO_FONT, TOKENS } from "../constants";
import {
  LOOKS,
  PhotoWashCtx,
  ThemeCtx,
  WashCtx,
  type Format,
  type LookItem,
  type Theme,
} from "../prototype-looks/LooksPrototype";

export type WashPhoto = {
  label: string;
  img: string | null;
  hx: number;
  hy: number;
};

type Step = "Zacht" | "Normaal" | "Sterk";
const STEPS: Step[] = ["Zacht", "Normaal", "Sterk"];
/** top = band behind the crest; ramp/plateau = where the wash starts / is
 * nearly full (% of the photo height); bottom = cover at the very bottom. */
type Stops = { top: number; ramp: number; plateau: number; bottom: number };
type Table = Record<Theme, Record<Step, Stops>>;

const VARIANTS = {
  "1": "Meer dekking",
  "2": "Hoger",
  "3": "Allebei",
} as const;
type V = keyof typeof VARIANTS;
const VKEYS = Object.keys(VARIANTS) as V[];

const both = (s: Record<Step, Stops>): Table => ({
  light: structuredClone(s),
  dark: structuredClone(s),
});
const START: Record<V, Table> = {
  "1": both({
    Zacht: { top: 0.45, ramp: 45, plateau: 72, bottom: 0.72 },
    Normaal: { top: 0.6, ramp: 45, plateau: 72, bottom: 0.86 },
    Sterk: { top: 0.7, ramp: 45, plateau: 72, bottom: 0.97 },
  }),
  "2": both({
    Zacht: { top: 0.6, ramp: 60, plateau: 84, bottom: 0.92 },
    Normaal: { top: 0.6, ramp: 45, plateau: 72, bottom: 0.92 },
    Sterk: { top: 0.6, ramp: 28, plateau: 56, bottom: 0.92 },
  }),
  "3": both({
    Zacht: { top: 0.45, ramp: 55, plateau: 80, bottom: 0.75 },
    Normaal: { top: 0.6, ramp: 45, plateau: 72, bottom: 0.88 },
    Sterk: { top: 0.7, ramp: 32, plateau: 60, bottom: 0.97 },
  }),
};

function gradient(s: Stops) {
  return (c: string) =>
    `linear-gradient(180deg, rgba(${c},${s.top}) 0%, rgba(${c},0) 20%, ` +
    `rgba(${c},${(s.bottom * 0.16).toFixed(2)}) ${s.ramp}%, ` +
    `rgba(${c},${(s.bottom * 0.86).toFixed(2)}) ${s.plateau}%, rgba(${c},${s.bottom}) 100%)`;
}

const LOOK_KEYS = ["C", "A", "B", "E"] as const;
type LookKey = (typeof LOOK_KEYS)[number];
const FALLBACK: Record<LookKey, string> = {
  A: "/images/share-fallback/A-1.webp",
  B: "/images/share-fallback/B-2.webp",
  C: "/images/share-fallback/C-1.webp",
  E: "/images/share-fallback/E-1.webp",
};

const CELL = 200;

function Story({
  look,
  it,
  f,
  theme,
  stops,
  onPhoto,
  width,
}: {
  look: LookKey;
  it: LookItem;
  f: Format;
  theme: Theme;
  stops: Stops;
  onPhoto: boolean;
  width: number;
}) {
  const Look = LOOKS[look]!.C;
  const h = f === "story" ? 1920 : 1080;
  const k = width / 1080;
  return (
    <div style={{ width, height: h * k, overflow: "hidden", flex: "none" }}>
      <div style={{ transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <ThemeCtx.Provider value={theme}>
          <WashCtx.Provider value={gradient(stops)}>
            <PhotoWashCtx.Provider value={onPhoto}>
              <Look it={it} f={f} />
            </PhotoWashCtx.Provider>
          </WashCtx.Provider>
        </ThemeCtx.Provider>
      </div>
    </div>
  );
}

const chip = (on: boolean): React.CSSProperties => ({
  padding: "10px 14px",
  minHeight: 44,
  border: `2px solid ${TOKENS.ink}`,
  background: on ? TOKENS.ink : TOKENS.cream,
  color: on ? TOKENS.cream : TOKENS.ink,
  fontFamily: MONO_FONT,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
});

export function WashPrototype({
  variant,
  photos,
  article,
  event,
}: {
  variant: string;
  photos: WashPhoto[];
  article: LookItem;
  event: LookItem;
}) {
  const router = useRouter();
  const v: V = (VKEYS as string[]).includes(variant) ? (variant as V) : "1";
  const [tables, setTables] = useState<Record<V, Table>>(() =>
    structuredClone(START),
  );
  const [look, setLook] = useState<LookKey>("C");
  const [theme, setTheme] = useState<Theme>("dark");
  const [format, setFormat] = useState<Format>("story");
  const [kind, setKind] = useState<"article" | "event">("article");
  const [onPhoto, setOnPhoto] = useState(true);
  const [big, setBig] = useState<{ row: number; step: Step } | null>(null);
  const table = tables[v];

  const go = (d: number) => {
    const next = VKEYS[(VKEYS.indexOf(v) + d + VKEYS.length) % VKEYS.length]!;
    const q = new URLSearchParams(window.location.search);
    q.set("variant", next);
    router.replace(`?${q.toString()}`, { scroll: false });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") setBig(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const base = kind === "article" ? article : event;
  const rows: (WashPhoto & { fallback?: string })[] = [
    ...photos,
    {
      label: "AI-fallback",
      img: null,
      hx: 0.5,
      hy: 0.5,
      fallback: FALLBACK[look],
    },
  ];
  const itemFor = (r: (typeof rows)[number]): LookItem => ({
    ...base,
    key: `${base.key}-${r.label}`,
    img: r.img,
    hx: r.hx,
    hy: r.hy,
    fallback: r.fallback,
  });
  const set = (step: Step, k: keyof Stops, val: number) =>
    setTables((t) => {
      const n = structuredClone(t);
      n[v][theme][step][k] = val;
      return n;
    });
  const abe = look !== "C";

  return (
    <div
      style={{
        background: "#e9e6dc",
        minHeight: "100vh",
        padding: "16px 16px 120px",
        color: TOKENS.ink,
        fontFamily: MONO_FONT,
      }}
    >
      <p style={{ fontSize: 13, margin: "0 0 12px" }}>
        PROTOTYPE #3522 — wash tunen. Variant {v}: {VARIANTS[v]}. Tik een story
        om ze groot te zien.
      </p>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}
      >
        {LOOK_KEYS.map((k) => (
          <button key={k} style={chip(look === k)} onClick={() => setLook(k)}>
            {k} {LOOKS[k]!.name}
          </button>
        ))}
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}
      >
        {(["light", "dark"] as Theme[]).map((t) => (
          <button key={t} style={chip(theme === t)} onClick={() => setTheme(t)}>
            {t === "light" ? "Licht" : "Donker"}
          </button>
        ))}
        {(["story", "square"] as Format[]).map((x) => (
          <button
            key={x}
            style={chip(format === x)}
            onClick={() => setFormat(x)}
          >
            {x === "story" ? "9:16" : "1:1"}
          </button>
        ))}
        {(["article", "event"] as const).map((x) => (
          <button key={x} style={chip(kind === x)} onClick={() => setKind(x)}>
            {x === "article" ? "Nieuws" : "Evenement"}
          </button>
        ))}
        {abe && (
          <button style={chip(onPhoto)} onClick={() => setOnPhoto((o) => !o)}>
            Wash op foto-vak: {onPhoto ? "aan" : "uit"}
          </button>
        )}
      </div>

      {/* Sliders: one column per step, for the theme shown. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          margin: "12px 0 20px",
        }}
      >
        {STEPS.map((step) => {
          const s = table[theme][step];
          const slider = (
            k: keyof Stops,
            min: number,
            max: number,
            st: number,
          ) => (
            <label
              key={k}
              style={{ display: "block", fontSize: 12, marginTop: 6 }}
            >
              {k} = {s[k]}
              {k === "ramp" || k === "plateau" ? "%" : ""}
              <input
                type="range"
                min={min}
                max={max}
                step={st}
                value={s[k]}
                onChange={(e) => set(step, k, Number(e.target.value))}
                style={{ display: "block", width: "100%", height: 32 }}
              />
            </label>
          );
          return (
            <div
              key={step}
              style={{
                background: TOKENS.cream,
                padding: 12,
                border: `2px solid ${TOKENS.ink}`,
              }}
            >
              <strong style={{ fontSize: 14 }}>
                {step} · {theme === "light" ? "Licht" : "Donker"}
              </strong>
              {slider("top", 0, 1, 0.01)}
              {slider("ramp", 0, 95, 1)}
              {slider("plateau", 5, 100, 1)}
              {slider("bottom", 0, 1, 0.01)}
            </div>
          );
        })}
      </div>

      {/* Grid: rows = photos, columns = steps. */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 10 }}>
          <thead>
            <tr>
              <th />
              {STEPS.map((s) => (
                <th key={s} style={{ fontSize: 13, textAlign: "left" }}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label}>
                <td
                  style={{ fontSize: 12, verticalAlign: "top", maxWidth: 90 }}
                >
                  {r.label}
                </td>
                {STEPS.map((step) => (
                  <td key={step} style={{ verticalAlign: "top" }}>
                    <button
                      onClick={() => setBig({ row: i, step })}
                      style={{
                        padding: 0,
                        border: 0,
                        cursor: "zoom-in",
                        display: "block",
                      }}
                      aria-label={`${r.label} ${step} groot`}
                    >
                      <Story
                        look={look}
                        it={itemFor(r)}
                        f={format}
                        theme={theme}
                        stops={table[theme][step]}
                        onPhoto={abe && onPhoto}
                        width={CELL}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 14, marginTop: 24 }}>
        Tabel (variant {v}) — kopieer dit als antwoord
      </h2>
      <pre
        style={{
          background: TOKENS.cream,
          padding: 12,
          fontSize: 12,
          overflowX: "auto",
          userSelect: "all",
          border: `2px solid ${TOKENS.ink}`,
        }}
      >
        {JSON.stringify({ variant: VARIANTS[v], ...table }, null, 1)}
      </pre>

      {big && (
        <div
          onClick={() => setBig(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            cursor: "zoom-out",
          }}
        >
          <div
            style={{
              color: "#fff",
              position: "absolute",
              top: 12,
              left: 16,
              fontSize: 13,
            }}
          >
            {rows[big.row]!.label} · {big.step} ·{" "}
            {theme === "light" ? "Licht" : "Donker"} — tik om te sluiten
          </div>
          <Story
            look={look}
            it={itemFor(rows[big.row]!)}
            f={format}
            theme={theme}
            stops={table[theme][big.step]}
            onPhoto={abe && onPhoto}
            width={Math.min(
              typeof window === "undefined" ? 400 : window.innerWidth - 32,
              ((typeof window === "undefined" ? 800 : window.innerHeight - 64) *
                1080) /
                (format === "story" ? 1920 : 1080),
            )}
          />
        </div>
      )}

      {/* Prototype switcher — never ships (route 404s in production). */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#111",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 999,
          boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          zIndex: 40,
          fontFamily: MONO_FONT,
          fontSize: 13,
        }}
      >
        <button
          aria-label="Vorige variant"
          onClick={() => go(-1)}
          style={{ color: "#fff", minWidth: 44, minHeight: 44 }}
        >
          ←
        </button>
        <span>
          {v} ({VARIANTS[v]})
        </span>
        <button
          aria-label="Volgende variant"
          onClick={() => go(1)}
          style={{ color: "#fff", minWidth: 44, minHeight: 44 }}
        >
          →
        </button>
      </div>
    </div>
  );
}
