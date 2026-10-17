"use client";

// PROTOTYPE (#3524) — throwaway. Answers: how do the /share controls sit on an
// iPhone at the pitch — order, grouping, one-thumb reach, whether the preview
// stays visible, where the look picker sits. ?variant= picks the layout:
// 1 Stappen (one step at a time under a fixed preview), 2 Lade (full preview,
// tab bar + sheet at the thumb), 3 Lijst (one scrolling page, preview on top).
// Every control is live on real content; the looks come from #3509/#3519.
// The variant pill sits at the TOP, not the bottom: the bottom is the thumb zone under test.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { MONO_FONT, TOKENS } from "../constants";
import {
  LOOKS,
  ThemeCtx,
  WashCtx,
  type Format,
  type LookItem,
  type Theme,
} from "../prototype-looks/LooksPrototype";
import {
  FALLBACK,
  matchItem,
  tagWedstrijd,
  Wedstrijd,
  type Player,
  type TKey,
} from "../prototype-blocks/BlocksPrototype";

const VARIANTS = { "1": "Stappen", "2": "Lade", "3": "Lijst" } as const;
type V = keyof typeof VARIANTS;
const VKEYS = Object.keys(VARIANTS) as V[];

type Mode = "match" | "news" | "event";
type LookKey = "A" | "B" | "C" | "E" | "W";
const LOOK_NAME: Record<LookKey, string> = {
  A: "Kaart",
  B: "Plakboek",
  C: "Affiche",
  E: "Ticket",
  W: "Wedstrijd",
};
const lookKeys = (m: Mode): LookKey[] =>
  m === "match" ? ["A", "B", "C", "E", "W"] : ["A", "B", "C", "E"];
const MOMENTS: { key: TKey; label: string }[] = [
  { key: "kickoff", label: "Aftrap" },
  { key: "halftime", label: "Rust" },
  { key: "fulltime", label: "Einde" },
  { key: "goal", label: "Goal" },
  { key: "against", label: "Tegengoal" },
  { key: "card", label: "Kaart" },
];

// The wash decided in #3522 — look C only.
type Step = "Zacht" | "Normaal" | "Sterk";
const STEPS: Step[] = ["Zacht", "Normaal", "Sterk"];
const WASH: Record<Theme, Record<Step, number[]>> = {
  light: {
    Zacht: [0.45, 55, 80, 0.75],
    Normaal: [0.6, 45, 72, 0.88],
    Sterk: [0.7, 32, 60, 0.97],
  },
  dark: {
    Zacht: [0.45, 55, 80, 0.6],
    Normaal: [0.6, 45, 72, 0.7],
    Sterk: [0.7, 32, 60, 0.8],
  },
};
const gradient =
  ([top, ramp, plateau, bottom]: number[]) =>
  (c: string) =>
    `linear-gradient(180deg, rgba(${c},${top}) 0%, rgba(${c},0) 20%, ` +
    `rgba(${c},${(bottom! * 0.16).toFixed(2)}) ${ramp}%, ` +
    `rgba(${c},${(bottom! * 0.86).toFixed(2)}) ${plateau}%, rgba(${c},${bottom}) 100%)`;

// The real tool lists the club's coming matches; the label carries the squad.
const MATCHES = [
  {
    label: "A — FC Dummy · za 24/10",
    away: "FC Dummy",
    comp: "3de Provinciale B",
  },
  {
    label: "B — SK Rouge · zo 25/10",
    away: "SK Rouge",
    comp: "4de Provinciale D",
  },
  {
    label: "U17 — VC Groen · za 24/10",
    away: "VC Groen",
    comp: "U17 Gewestelijk",
  },
];

const SEL = '[data-move~="2"]';
type Pos = Record<string, { x: number; y: number }>;

// ── All state in one place, so every layout drives the same tool ───────────
function useShare(articles: LookItem[], events: LookItem[], player: Player) {
  const [mode, setModeRaw] = useState<Mode>("match");
  const [moment, setMoment] = useState<TKey>("goal");
  const [articleIdx, setArticleIdx] = useState(0);
  const [eventIdx, setEventIdx] = useState(0);
  const [look, setLook] = useState<LookKey>("A");
  const [theme, setTheme] = useState<Theme>("light");
  const [wash, setWash] = useState<Step>("Normaal");
  const [format, setFormat] = useState<Format>("story");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [arrange, setArrange] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [back, setBack] = useState<Record<string, boolean>>({});
  const [snap, setSnap] = useState(true);
  const [posBy, setPosBy] = useState<Record<string, Pos>>({});
  const [saved, setSaved] = useState(0);

  const setMode = (m: Mode) => {
    setModeRaw(m);
    if (m !== "match" && look === "W") setLook("A");
    setEdits({});
  };
  const base: LookItem | null =
    mode === "news"
      ? (articles[articleIdx] ?? null)
      : mode === "event"
        ? (events[eventIdx] ?? null)
        : {
            ...matchItem(moment, {
              name: edits.player || player.name,
              img: player.img,
            }),
            fallback: FALLBACK[look],
          };
  let item = base;
  if (item && edits.title)
    item = {
      ...item,
      title: edits.title,
      spans: [{ text: edits.title, accent: false }],
    };
  if (item?.match && (edits.minute || edits.score))
    item = {
      ...item,
      match: {
        ...item.match,
        minute: edits.minute || item.match.minute,
        score: edits.score || item.match.score,
      },
    };
  if (item && edits.location) item = { ...item, location: edits.location };
  if (item?.match) {
    const m = MATCHES[Number(edits.match ?? 0)]!;
    const swap = (t: string) => t.replace("FC Dummy", m.away);
    item = {
      ...item,
      title: swap(item.title),
      spans: item.spans.map((x) => ({ ...x, text: swap(x.text) })),
      match: {
        ...item.match,
        away: m.away,
        competition: edits.competition || m.comp,
      },
      date: edits.date
        ? `${edits.date}T${edits.time || "15:00"}:00`
        : item.date,
      time: edits.time || item.time,
    };
  }
  if (item && edits.photo)
    item = { ...item, img: edits.photo, hx: 0.5, hy: 0.35 };

  const itemKey = mode === "match" ? moment : (base?.key ?? "none");
  // Positions are kept per format and cleared by another look/template/item (#3520/#3521).
  const posKey = `${look}|${mode}|${itemKey}|${format}`;
  const pos = posBy[posKey] ?? {};
  const setPos = (name: string, p: { x: number; y: number }) =>
    setPosBy((all) => ({ ...all, [posKey]: { ...all[posKey], [name]: p } }));
  const resetAll = () => {
    setPosBy((all) => ({ ...all, [posKey]: {} }));
    setBack({});
    setSelected(null);
  };
  const keys = lookKeys(mode);
  const nextLook = () =>
    setLook((l) => keys[(keys.indexOf(l) + 1) % keys.length]!);

  return {
    mode,
    setMode,
    moment,
    setMoment,
    articleIdx,
    setArticleIdx,
    eventIdx,
    setEventIdx,
    look,
    setLook,
    theme,
    setTheme,
    wash,
    setWash,
    format,
    setFormat,
    edits,
    setEdits,
    arrange,
    setArrange,
    selected,
    setSelected,
    back,
    setBack,
    snap,
    setSnap,
    pos,
    setPos,
    resetAll,
    nextLook,
    saved,
    setSaved,
    item,
    keys,
    articles,
    events,
    player,
    canvasKey: `${posKey}|${theme}|${wash}`,
  };
}
type S = ReturnType<typeof useShare>;

// ── The canvas: one look, scaled to fit a box, draggable in arrange mode ──
function Story({
  s,
  look,
  scale,
  live,
  capRef,
}: {
  s: S;
  look: LookKey;
  scale: number;
  live?: boolean;
  capRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const H = s.format === "story" ? 1920 : 1080;
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    el: HTMLElement;
    x: number;
    y: number;
    cx: number;
    cy: number;
    mid: number;
  } | null>(null);
  const [snapping, setSnapping] = useState(false);
  const Look = look === "W" ? null : LOOKS[look]!.C;
  const it =
    s.item && s.mode === "match"
      ? { ...s.item, fallback: FALLBACK[look] }
      : s.item;

  // Re-apply the stored offsets and Voor/Achter after every render.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !live) return;
    if (look === "W") tagWedstrijd(el);
    for (const b of el.querySelectorAll<HTMLElement>(SEL)) {
      const n = b.dataset.name ?? "?";
      const p = s.pos[n];
      b.style.translate = p ? `${p.x}px ${p.y}px` : "";
      if (getComputedStyle(b).position === "static")
        b.style.position = "relative";
      b.style.zIndex = s.back[n] ? "0" : "20";
      if (s.arrange && s.selected === n) b.dataset.selected = "1";
      else delete b.dataset.selected;
    }
  });

  const square = s.format === "square";
  const wedstrijdOk =
    s.mode === "match" &&
    (!square || s.moment === "kickoff" || s.moment === "fulltime");
  return (
    <div
      style={{
        width: 1080 * scale,
        height: H * scale,
        overflow: "hidden",
        position: "relative",
        flex: "none",
        background: "#fff",
        boxShadow: live ? "0 2px 12px rgba(0,0,0,0.25)" : undefined,
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <div
          ref={root}
          className={live && s.arrange ? "arr" : undefined}
          onPointerDown={(e) => {
            if (!live || !s.arrange) return;
            const el = (e.target as HTMLElement).closest<HTMLElement>(SEL);
            if (!el) return;
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            const n = el.dataset.name ?? "?";
            const p = s.pos[n] ?? { x: 0, y: 0 };
            const r = el.getBoundingClientRect();
            const c = root.current!.getBoundingClientRect();
            // The block's centre with no offset, in canvas pixels.
            const mid = (r.left + r.width / 2 - c.left) / scale - p.x;
            drag.current = { el, ...p, cx: e.clientX, cy: e.clientY, mid };
            s.setSelected(n);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            let x = d.x + (e.clientX - d.cx) / scale;
            const y = d.y + (e.clientY - d.cy) / scale;
            const near = s.snap && Math.abs(d.mid + x - 540) < 28;
            if (near) x = 540 - d.mid;
            setSnapping(near);
            d.el.style.translate = `${x}px ${y}px`;
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (!d) return;
            const [x, y] = d.el.style.translate.split(" ").map(parseFloat);
            if (Math.abs(e.clientX - d.cx) + Math.abs(e.clientY - d.cy) > 2)
              s.setPos(d.el.dataset.name ?? "?", { x: x ?? 0, y: y ?? 0 });
            drag.current = null;
            setSnapping(false);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setSnapping(false);
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          <div key={s.canvasKey} ref={live ? capRef : undefined}>
            <ThemeCtx.Provider value={s.theme}>
              <WashCtx.Provider
                value={look === "C" ? gradient(WASH[s.theme][s.wash]) : null}
              >
                {look === "W" ? (
                  wedstrijdOk ? (
                    <Wedstrijd
                      t={s.moment}
                      f={s.format}
                      player={{
                        name: s.edits.player || s.player.name,
                        img: s.edits.photo || s.player.img,
                      }}
                    />
                  ) : (
                    <Empty f={s.format} text="Niet in vierkant" />
                  )
                ) : it && Look ? (
                  <Look it={it} f={s.format} />
                ) : (
                  <Empty f={s.format} text="Geen inhoud" />
                )}
              </WashCtx.Provider>
            </ThemeCtx.Provider>
          </div>
        </div>
      </div>
      {snapping && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            width: 2,
            marginLeft: -1,
            background: "#e11d48",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

function Empty({ f, text }: { f: Format; text: string }) {
  return (
    <div
      style={{
        width: 1080,
        height: f === "story" ? 1920 : 1080,
        display: "grid",
        placeItems: "center",
        background: TOKENS.creamDeep,
        fontFamily: MONO_FONT,
        fontSize: 60,
      }}
    >
      {text}
    </div>
  );
}

/** Measures a box so the canvas fits inside it, whatever the layout gives it. */
function useBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 300, h: 500 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setBox({ w: e!.contentRect.width, h: e!.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

function FitPreview({
  s,
  capRef,
  style,
}: {
  s: S;
  capRef: React.RefObject<HTMLDivElement | null>;
  style?: React.CSSProperties;
}) {
  const [ref, box] = useBox();
  const H = s.format === "story" ? 1920 : 1080;
  const scale = Math.max(0.05, Math.min(box.w / 1080, box.h / H));
  return (
    <div
      ref={ref}
      style={{
        minHeight: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        ...style,
      }}
    >
      <Story s={s} look={s.look} scale={scale} live capRef={capRef} />
    </div>
  );
}

// ── Controls, shared by every layout ───────────────────────────────────────
const btn = (on: boolean, big = false): React.CSSProperties => ({
  flex: 1,
  minHeight: big ? 52 : 44,
  padding: "8px 10px",
  border: `2px solid ${TOKENS.ink}`,
  background: on ? TOKENS.ink : TOKENS.cream,
  color: on ? TOKENS.cream : TOKENS.ink,
  fontFamily: MONO_FONT,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  touchAction: "manipulation",
});
const label: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: TOKENS.inkMuted,
  margin: "0 0 6px",
};

function Seg<T extends string>({
  opts,
  value,
  onChange,
  disabled,
}: {
  opts: { key: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 0, opacity: disabled ? 0.35 : 1 }}>
      {opts.map((o, i) => (
        <button
          key={o.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.key)}
          style={{ ...btn(value === o.key), marginLeft: i ? -2 : 0 }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={label}>{title}</p>
      {children}
    </section>
  );
}

function KindSwitch({ s }: { s: S }) {
  return (
    <Seg
      opts={[
        { key: "match" as Mode, label: "Wedstrijd" },
        { key: "news" as Mode, label: "Nieuws" },
        { key: "event" as Mode, label: "Evenement" },
      ]}
      value={s.mode}
      onChange={s.setMode}
    />
  );
}

function ItemPicker({ s }: { s: S }) {
  const set = (k: string, v: string) => s.setEdits({ ...s.edits, [k]: v });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {s.mode === "match" && (
        <select
          aria-label="Match"
          value={s.edits.match ?? "0"}
          onChange={(e) => set("match", e.target.value)}
          style={{
            fontSize: 16,
            minHeight: 44,
            padding: "0 10px",
            border: `2px solid ${TOKENS.ink}`,
            background: "#fff",
            fontFamily: MONO_FONT,
          }}
        >
          {MATCHES.map((m, i) => (
            <option key={m.label} value={i}>
              {m.label}
            </option>
          ))}
        </select>
      )}
      <ItemList s={s} />
      <label
        style={{
          ...btn(Boolean(s.edits.photo)),
          textAlign: "center",
          display: "grid",
          placeItems: "center",
        }}
      >
        {s.edits.photo ? "Andere foto…" : "Eigen foto…"}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) set("photo", URL.createObjectURL(f));
          }}
        />
      </label>
      {s.edits.photo && (
        <button
          type="button"
          onClick={() => set("photo", "")}
          style={btn(false)}
        >
          Foto weghalen
        </button>
      )}
    </div>
  );
}

function ItemList({ s }: { s: S }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  if (s.mode === "match")
    return (
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}
      >
        {MOMENTS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => s.setMoment(m.key)}
            style={btn(s.moment === m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
    );
  const list = s.mode === "news" ? s.articles : s.events;
  const idx = s.mode === "news" ? s.articleIdx : s.eventIdx;
  const pick = (i: number) => {
    if (s.mode === "news") s.setArticleIdx(i);
    else s.setEventIdx(i);
    s.setEdits({});
    setOpen(false);
    setQ("");
  };
  const hits = list
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...btn(false),
          textAlign: "left",
          textTransform: "none",
          letterSpacing: 0,
          fontSize: 15,
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {list[idx]?.title ?? "Kies…"}
        </span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          style={{
            border: `2px solid ${TOKENS.ink}`,
            background: "#fff",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek…"
            style={{
              width: "100%",
              fontSize: 16,
              padding: 10,
              border: 0,
              borderBottom: `1px solid ${TOKENS.paperEdge}`,
              position: "sticky",
              top: 0,
            }}
          />
          {hits.map(({ it, i }) => (
            <button
              key={it.key}
              type="button"
              onClick={() => pick(i)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 10px",
                fontSize: 15,
                borderBottom: `1px solid ${TOKENS.paperEdge}`,
                background: i === idx ? TOKENS.creamDeep : "#fff",
              }}
            >
              {it.title}
              <span style={{ ...label, display: "block", margin: "2px 0 0" }}>
                {it.articleType ?? it.eventType} ·{" "}
                {it.date?.slice(0, 10) ?? "—"}
                {it.img ? "" : " · geen cover"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LookPicker({ s, size = 64 }: { s: S; size?: number }) {
  const H = s.format === "story" ? 1920 : 1080;
  const scale = size / 1080;
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 2,
        scrollbarWidth: "none",
      }}
    >
      {s.keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => s.setLook(k)}
          style={{
            flex: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: 3,
            border: `3px solid ${s.look === k ? TOKENS.jerseyDeep : "transparent"}`,
            background: "transparent",
          }}
        >
          <div
            style={{ width: size, height: H * scale, pointerEvents: "none" }}
          >
            <Story s={s} look={k} scale={scale} />
          </div>
          <span style={{ ...label, margin: 0, color: TOKENS.ink }}>
            {LOOK_NAME[k]}
          </span>
        </button>
      ))}
    </div>
  );
}

function StyleControls({ s }: { s: S }) {
  return (
    <>
      {s.look !== "W" && (
        <Group title="Thema">
          <Seg
            opts={[
              { key: "light" as Theme, label: "Licht" },
              { key: "dark" as Theme, label: "Donker" },
            ]}
            value={s.theme}
            onChange={s.setTheme}
          />
        </Group>
      )}
      {s.look === "C" && (
        <Group title="Waas over de foto">
          <Seg
            opts={STEPS.map((k) => ({ key: k, label: k }))}
            value={s.wash}
            onChange={s.setWash}
          />
        </Group>
      )}
      <Group title="Formaat">
        <Seg
          opts={[
            { key: "story" as Format, label: "Story 9:16" },
            { key: "square" as Format, label: "Vierkant" },
          ]}
          value={s.format}
          onChange={s.setFormat}
        />
      </Group>
    </>
  );
}

function Fields({ s }: { s: S }) {
  const field = (k: string, l: string, ph: string, type = "text") => (
    <label
      key={k}
      style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}
    >
      <span style={label}>{l}</span>
      <input
        type={type}
        value={s.edits[k] ?? ""}
        placeholder={ph}
        onChange={(e) => s.setEdits({ ...s.edits, [k]: e.target.value })}
        style={{
          fontSize: 16,
          padding: 10,
          minHeight: 44,
          border: `2px solid ${TOKENS.ink}`,
          background: "#fff",
        }}
      />
    </label>
  );
  const it = s.item;
  if (s.mode === "match")
    return (
      <>
        {(s.moment === "goal" || s.moment === "card") &&
          field("player", "Speler", s.player.name)}
        {["goal", "against", "card"].includes(s.moment) &&
          field("minute", "Minuut", it?.match?.minute ?? "")}
        {["halftime", "fulltime", "goal", "against"].includes(s.moment) &&
          field("score", "Stand", it?.match?.score ?? "")}
        {s.moment === "kickoff" &&
          field("location", "Terrein", it?.location ?? "")}
        {s.moment === "kickoff" && (
          <div style={{ display: "flex", gap: 8 }}>
            {field("date", "Datum", "2026-10-24", "date")}
            {field("time", "Uur", "20:00", "time")}
          </div>
        )}
        {field("competition", "Competitie", it?.match?.competition ?? "")}
        {s.moment === "fulltime" && (
          <Group title="Stemming">
            <Seg
              opts={[
                { key: "win", label: "Gewonnen" },
                { key: "draw", label: "Gelijk" },
                { key: "loss", label: "Verloren" },
              ]}
              value={s.edits.mood ?? "win"}
              onChange={(v) => s.setEdits({ ...s.edits, mood: v })}
            />
          </Group>
        )}
      </>
    );
  return (
    <>
      {field("title", "Titel", it?.title ?? "")}
      {s.mode === "event" && field("location", "Locatie", it?.location ?? "")}
    </>
  );
}

function ArrangeControls({ s, compact }: { s: S; compact?: boolean }) {
  const sel = s.selected;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {!compact && (
        <p style={{ ...label, color: TOKENS.ink }}>
          {sel ? `Gekozen: ${sel}` : "Tik of sleep een blok in de preview"}
        </p>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 2 }}>
          <Seg
            opts={[
              { key: "voor", label: "Voor" },
              { key: "achter", label: "Achter" },
            ]}
            value={sel ? (s.back[sel] ? "achter" : "voor") : null}
            disabled={!sel}
            onChange={(v) =>
              sel && s.setBack({ ...s.back, [sel]: v === "achter" })
            }
          />
        </div>
        <button
          type="button"
          onClick={() => s.setSnap(!s.snap)}
          style={{ ...btn(s.snap), flex: 1 }}
        >
          Midden {s.snap ? "aan" : "uit"}
        </button>
      </div>
      <button type="button" onClick={s.resetAll} style={btn(false)}>
        Alles terugzetten
      </button>
    </div>
  );
}

function useSave(s: S, capRef: React.RefObject<HTMLDivElement | null>) {
  const [busy, setBusy] = useState(false);
  async function save() {
    const node = capRef.current;
    if (!node || busy) return;
    setBusy(true);
    const wasArr = s.arrange;
    s.setArrange(false);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const opts = {
      width: 1080,
      height: s.format === "story" ? 1920 : 1080,
      pixelRatio: 1,
      includeQueryParams: true,
      cacheBust: true,
    };
    try {
      await toPng(node, opts); // iOS Safari warm-up, as in SharePage
      const url = await toPng(node, opts);
      const a = document.createElement("a");
      a.href = url;
      a.download = `share-${s.look}-${s.format}.png`;
      a.click();
      s.setSaved(s.saved + 1);
      // #3510: the tool advances to the next look after each saved story.
      s.nextLook();
      s.resetAll();
    } finally {
      s.setArrange(wasArr);
      setBusy(false);
    }
  }
  return { save, busy };
}

function SaveButton({
  s,
  capRef,
  style,
}: {
  s: S;
  capRef: React.RefObject<HTMLDivElement | null>;
  style?: React.CSSProperties;
}) {
  const { save, busy } = useSave(s, capRef);
  return (
    <button
      type="button"
      onClick={save}
      style={{
        ...btn(true, true),
        background: TOKENS.jerseyDeep,
        borderColor: TOKENS.jerseyDeep,
        ...style,
      }}
    >
      {busy ? "Bezig…" : "Bewaar PNG"}
    </button>
  );
}

// ── Variant 1: Stappen ─────────────────────────────────────────────────────
const STEP_NAMES = ["Wat", "Look", "Stijl", "Tekst", "Schik"] as const;
function Stappen({
  s,
  capRef,
}: {
  s: S;
  capRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [step, setStepRaw] = useState(0);
  const setStep = (i: number) => {
    setStepRaw(i);
    s.setArrange(i === 4);
  };
  const last = step === STEP_NAMES.length - 1;
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <FitPreview
        s={s}
        capRef={capRef}
        style={{ flex: 1, padding: "44px 12px 8px" }}
      />
      <div style={{ display: "flex", borderTop: `2px solid ${TOKENS.ink}` }}>
        {STEP_NAMES.map((n, i) => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(i)}
            style={{
              ...btn(step === i),
              border: 0,
              borderRight: i < 4 ? `1px solid ${TOKENS.paperEdge}` : 0,
              fontSize: 11,
            }}
          >
            {i + 1} {n}
          </button>
        ))}
      </div>
      <div
        style={{
          maxHeight: "36dvh",
          overflowY: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: TOKENS.creamSoft,
        }}
      >
        {step === 0 && (
          <>
            <KindSwitch s={s} />
            <ItemPicker s={s} />
          </>
        )}
        {step === 1 && <LookPicker s={s} size={72} />}
        {step === 2 && <StyleControls s={s} />}
        {step === 3 && <Fields s={s} />}
        {step === 4 && <ArrangeControls s={s} />}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 12px calc(8px + env(safe-area-inset-bottom))",
          background: TOKENS.cream,
          borderTop: `1px solid ${TOKENS.paperEdge}`,
        }}
      >
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          style={{ ...btn(false, true), flex: 1, opacity: step ? 1 : 0.35 }}
        >
          ‹ Vorige
        </button>
        {last ? (
          <SaveButton s={s} capRef={capRef} style={{ flex: 2 }} />
        ) : (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            style={{ ...btn(true, true), flex: 2 }}
          >
            Volgende ›
          </button>
        )}
      </div>
    </div>
  );
}

// ── Variant 2: Lade ────────────────────────────────────────────────────────
const TABS = ["Inhoud", "Stijl", "Tekst", "Schik"] as const;
type Tab = (typeof TABS)[number];
function Lade({
  s,
  capRef,
}: {
  s: S;
  capRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [tab, setTabRaw] = useState<Tab | null>(null);
  const setTab = (t: Tab | null) => {
    setTabRaw(t);
    s.setArrange(t === "Schik");
  };
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <FitPreview
        s={s}
        capRef={capRef}
        style={{ flex: 1, padding: "44px 12px 8px" }}
      />
      {tab && (
        <div
          style={{
            maxHeight: tab === "Schik" ? "24dvh" : "44dvh",
            overflowY: "auto",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: TOKENS.creamSoft,
            borderTop: `2px solid ${TOKENS.ink}`,
          }}
        >
          {tab === "Inhoud" && (
            <>
              <KindSwitch s={s} />
              <ItemPicker s={s} />
            </>
          )}
          {tab === "Stijl" && <StyleControls s={s} />}
          {tab === "Tekst" && <Fields s={s} />}
          {tab === "Schik" && <ArrangeControls s={s} compact />}
        </div>
      )}
      {/* Drag mode gives the look strip's room back to the preview. */}
      <div
        style={{
          display: tab === "Schik" ? "none" : undefined,
          padding: "6px 8px 4px",
          background: TOKENS.cream,
          borderTop: `1px solid ${TOKENS.paperEdge}`,
        }}
      >
        <LookPicker s={s} size={44} />
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "6px 8px calc(6px + env(safe-area-inset-bottom))",
          background: TOKENS.cream,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(tab === t ? null : t)}
            style={{ ...btn(tab === t, true), fontSize: 11, padding: 4 }}
          >
            {t}
          </button>
        ))}
        <SaveButton s={s} capRef={capRef} style={{ flex: 1.6, fontSize: 12 }} />
      </div>
    </div>
  );
}

// ── Variant 3: Lijst ───────────────────────────────────────────────────────
function Lijst({
  s,
  capRef,
}: {
  s: S;
  capRef: React.RefObject<HTMLDivElement | null>;
}) {
  const top = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  useEffect(() => {
    const el = top.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setAway(!e!.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const H = s.format === "story" ? 1920 : 1080;
  return (
    <div
      style={{ padding: "48px 16px calc(96px + env(safe-area-inset-bottom))" }}
    >
      <div ref={top}>
        {s.arrange ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 900,
              background: TOKENS.ink,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <FitPreview
              s={s}
              capRef={capRef}
              style={{ flex: 1, padding: "44px 12px 8px" }}
            />
            <div
              style={{
                padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
                background: TOKENS.cream,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <ArrangeControls s={s} />
              <button
                type="button"
                onClick={() => s.setArrange(false)}
                style={btn(true, true)}
              >
                Klaar
              </button>
            </div>
          </div>
        ) : (
          <FitPreview s={s} capRef={capRef} style={{ height: "58dvh" }} />
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          marginTop: 16,
        }}
      >
        <Group title="Soort">
          <KindSwitch s={s} />
        </Group>
        <Group title={s.mode === "match" ? "Moment" : "Item"}>
          <ItemPicker s={s} />
        </Group>
        <Group title="Look">
          <LookPicker s={s} size={96} />
        </Group>
        <StyleControls s={s} />
        <Group title="Tekst">
          <Fields s={s} />
        </Group>
        <Group title="Blokken">
          <button
            type="button"
            onClick={() => s.setArrange(true)}
            style={btn(false, true)}
          >
            Blokken verschuiven…
          </button>
        </Group>
      </div>
      {away && !s.arrange && (
        <button
          type="button"
          aria-label="Naar de preview"
          onClick={() =>
            document
              .getElementById("share-tool")
              ?.scrollTo({ top: 0, behavior: "smooth" })
          }
          style={{
            position: "fixed",
            right: 12,
            bottom: "calc(80px + env(safe-area-inset-bottom))",
            width: 72,
            height: (H * 72) / 1080,
            padding: 0,
            border: `2px solid ${TOKENS.ink}`,
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            zIndex: 800,
            pointerEvents: "auto",
          }}
        >
          <div style={{ pointerEvents: "none" }}>
            <Story s={s} look={s.look} scale={68 / 1080} />
          </div>
        </button>
      )}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
          background: TOKENS.cream,
          borderTop: `1px solid ${TOKENS.paperEdge}`,
          zIndex: 700,
          display: "flex",
        }}
      >
        <SaveButton s={s} capRef={capRef} />
      </div>
    </div>
  );
}

// ── Shell: variant switcher at the top ─────────────────────────────────────
export function ControlsPrototype({
  variant,
  articles,
  events,
  player,
}: {
  variant: string;
  articles: LookItem[];
  events: LookItem[];
  player: Player;
}) {
  const router = useRouter();
  const v: V = (VKEYS as string[]).includes(variant) ? (variant as V) : "1";
  const s = useShare(articles, events, player);
  const capRef = useRef<HTMLDivElement>(null);
  const go = (d: number) => {
    const next = VKEYS[(VKEYS.indexOf(v) + d + VKEYS.length) % VKEYS.length]!;
    const q = new URLSearchParams(window.location.search);
    q.set("variant", next);
    s.setArrange(false);
    router.replace(`?${q}`, { scroll: false });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const Layout = v === "1" ? Stappen : v === "2" ? Lade : Lijst;
  return (
    // Covers the site header: at the pitch the tool is the whole screen.
    <div
      id="share-tool"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        overflowY: "auto",
        background: TOKENS.cream,
        fontFamily: MONO_FONT,
        color: TOKENS.ink,
      }}
    >
      <style>{`
        .arr ${SEL} { touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; outline: 5px dashed rgba(225,29,72,0.7); outline-offset: 4px; }
        .arr [data-selected] { outline: 10px solid #e11d48 !important; }
      `}</style>
      <Layout key={v} s={s} capRef={capRef} />
      {process.env.NODE_ENV !== "production" && (
        <div
          style={{
            position: "fixed",
            top: 6,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            background: "#e11d48",
            color: "#fff",
            borderRadius: 999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <button
            type="button"
            onClick={() => go(-1)}
            style={{ padding: "6px 12px", color: "#fff" }}
          >
            ‹
          </button>
          <span>
            {v} · {VARIANTS[v]}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            style={{ padding: "6px 12px", color: "#fff" }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
