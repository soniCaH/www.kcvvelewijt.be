"use client";

// PROTOTYPE (#3519) — throwaway. Answers: which blocks move in each look
// (A Kaart, B Plakboek, C Affiche, E Ticket, W Wedstrijd) for every template,
// what stays pinned, and whether a look's own frame moves as one block.
// ?variant= picks how fine the blocks are: 1 every piece alone, 2 groups,
// 3 the look's frame as one. Drag by finger or mouse; free x/y as in #3508.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { MONO_FONT, TOKENS } from "../constants";
import {
  LOOKS,
  ThemeCtx,
  type Format,
  type LookItem,
  type MatchBits,
  type Theme,
} from "../prototype-looks/LooksPrototype";
import { KickoffTemplate } from "../KickoffTemplate/KickoffTemplate";
import { HalftimeTemplate } from "../HalftimeTemplate/HalftimeTemplate";
import { FullTimeTemplate } from "../FullTimeTemplate/FullTimeTemplate";
import { GoalKcvvTemplate } from "../GoalKcvvTemplate/GoalKcvvTemplate";
import { GoalOpponentTemplate } from "../GoalOpponentTemplate/GoalOpponentTemplate";
import { DisciplinaryCard } from "../shared/DisciplinaryCard";
import { SquarePreGameTemplate } from "../SquarePreGameTemplate/SquarePreGameTemplate";
import { SquareResultTemplate } from "../SquareResultTemplate/SquareResultTemplate";

const VARIANTS = {
  "1": "Elk stuk apart",
  "2": "Groepjes",
  "3": "Het hele kader",
} as const;
type V = keyof typeof VARIANTS;
const VKEYS = Object.keys(VARIANTS) as V[];

const LOOK_KEYS = ["A", "B", "C", "E", "W"] as const;
type LookKey = (typeof LOOK_KEYS)[number];
const LOOK_NAME: Record<LookKey, string> = {
  A: "Kaart",
  B: "Plakboek",
  C: "Affiche",
  E: "Ticket",
  W: "Wedstrijd",
};
// One #3518 keeper per look for match moments without a photo.
export const FALLBACK: Record<string, string> = {
  A: "/images/share-fallback/A-1.webp",
  B: "/images/share-fallback/B-2.webp",
  C: "/images/share-fallback/C-1.webp",
  E: "/images/share-fallback/E-1.webp",
};

const AWAY = "FC Dummy";
const AWAY_LOGO = "/images/logos/clubs/dummy-rouge.svg";
const MATCH_NAME = `KCVV Elewijt — ${AWAY}`;
const COMP = "3de Provinciale B";
const SCORE = "2-1";

export interface Player {
  name: string;
  img: string | null;
}

export type TKey =
  | "news"
  | "event"
  | "kickoff"
  | "halftime"
  | "fulltime"
  | "goal"
  | "against"
  | "card";
export const TEMPLATES: { key: TKey; label: string }[] = [
  { key: "news", label: "Nieuws" },
  { key: "event", label: "Evenement" },
  { key: "kickoff", label: "Aftrap" },
  { key: "halftime", label: "Rust" },
  { key: "fulltime", label: "Einde" },
  { key: "goal", label: "Goal" },
  { key: "against", label: "Tegengoal" },
  { key: "card", label: "Kaart" },
];

export function matchItem(t: TKey, player: Player): LookItem {
  const bits: MatchBits = {
    moment: t as MatchBits["moment"],
    away: AWAY,
    awayLogo: AWAY_LOGO,
    competition: COMP,
    score: ["halftime", "fulltime", "goal", "against"].includes(t)
      ? SCORE
      : undefined,
    minute:
      t === "goal"
        ? "67"
        : t === "against"
          ? "71"
          : t === "card"
            ? "58"
            : undefined,
    card: t === "card" ? "yellow" : undefined,
  };
  const teams = [
    { text: "KCVV Elewijt", accent: true },
    { text: ` — ${AWAY}`, accent: false },
  ];
  const spans =
    t === "goal" || t === "card"
      ? [{ text: player.name, accent: false }]
      : t === "against"
        ? [{ text: AWAY, accent: false }]
        : teams;
  return {
    key: t,
    kind: "match",
    match: bits,
    title: spans.map((x) => x.text).join(""),
    spans,
    date: t === "kickoff" ? "2026-10-24T18:00:00Z" : null,
    time: t === "kickoff" ? "20:00" : null,
    location: t === "kickoff" ? "Terrein A" : null,
    // Only a goal has a real photo (the scorer); every other moment uses the look's fallback.
    img: t === "goal" ? player.img : null,
    hx: 0.5,
    hy: 0.3,
  };
}

/** Today's templates, unchanged. Square only exists for Aftrap and Einde. */
export function Wedstrijd({
  t,
  f,
  player,
}: {
  t: TKey;
  f: Format;
  player: Player;
}) {
  const crest = { awayLogo: AWAY_LOGO };
  if (f === "square") {
    if (t === "kickoff")
      return (
        <SquarePreGameTemplate
          matchName={MATCH_NAME}
          competition={COMP}
          dateTime="Zaterdag · 20:00"
          {...crest}
        />
      );
    if (t === "fulltime")
      return (
        <SquareResultTemplate
          matchName={MATCH_NAME}
          score={SCORE}
          mood="win"
          competition={COMP}
          {...crest}
        />
      );
    return null;
  }
  switch (t) {
    case "kickoff":
      return (
        <KickoffTemplate
          matchName={MATCH_NAME}
          competition={COMP}
          dateTime="Zaterdag · 20:00 · Terrein A"
          {...crest}
        />
      );
    case "halftime":
      return (
        <HalftimeTemplate
          matchName={MATCH_NAME}
          score={SCORE}
          competition={COMP}
          {...crest}
        />
      );
    case "fulltime":
      return (
        <FullTimeTemplate
          matchName={MATCH_NAME}
          score={SCORE}
          mood="win"
          competition={COMP}
          {...crest}
        />
      );
    case "goal":
      return (
        <GoalKcvvTemplate
          playerName={player.name}
          shirtNumber={9}
          score={SCORE}
          matchName={MATCH_NAME}
          minute="67"
          imageUrl={player.img ?? undefined}
          {...crest}
        />
      );
    case "against":
      return (
        <GoalOpponentTemplate
          score={SCORE}
          matchName={MATCH_NAME}
          minute="71"
          competition={COMP}
          {...crest}
        />
      );
    case "card":
      return (
        <DisciplinaryCard
          kind="yellow"
          side="kcvv"
          matchName={MATCH_NAME}
          minute="58"
          playerName={player.name}
          shirtNumber={9}
        />
      );
    default:
      return null;
  }
}

/**
 * The real templates carry no drag tags: tag them from the DOM. ShareMid is
 * the `flex: 1 1 auto` column; its children are the groups (2), a child's
 * own children the pieces (1), ShareMid itself the frame (3).
 */
export function tagWedstrijd(root: HTMLElement) {
  const mid = [...root.querySelectorAll<HTMLElement>("div")].find((d) =>
    d.style.flex.startsWith("1 1 auto"),
  );
  if (!mid) return;
  const name = (el: Element) =>
    (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 22) ||
    "Beeld (logo's, kaart)";
  mid.dataset.move = "3";
  mid.dataset.name = "Hele midden";
  for (const c of [...mid.children] as HTMLElement[]) {
    const kids = [...c.children] as HTMLElement[];
    const group = c.tagName === "DIV" && kids.length >= 2 && !c.style.display;
    c.dataset.move = group ? "2" : "1 2";
    c.dataset.name = name(c);
    if (group)
      for (const k of kids) {
        k.dataset.move = "1";
        k.dataset.name = name(k);
      }
  }
  const sibs = [...(mid.parentElement?.children ?? [])] as HTMLElement[];
  for (const s of sibs)
    if (s !== mid && s.offsetHeight > 0)
      s.dataset.pin = sibs.indexOf(s) < sibs.indexOf(mid) ? "Kop" : "Voet";
}

function useFitScale(max: number, w: number) {
  const [scale, setScale] = useState(max);
  useEffect(() => {
    const fit = () => setScale(Math.min(max, (window.innerWidth - 32) / w));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [max, w]);
  return scale;
}

export function BlocksPrototype({
  variant,
  articles,
  event,
  player,
}: {
  variant: string;
  articles: LookItem[];
  event: LookItem | null;
  player: Player;
}) {
  const router = useRouter();
  const v: V = (VKEYS as string[]).includes(variant) ? (variant as V) : "1";
  const [look, setLook] = useState<LookKey>("A");
  const [t, setT] = useState<TKey>("goal");
  const [articleIdx, setArticleIdx] = useState(0);
  const [format, setFormat] = useState<Format>("story");
  const [theme, setTheme] = useState<Theme>("light");
  const [show, setShow] = useState(true);
  const [reset, setReset] = useState(0);
  const [legend, setLegend] = useState<{ moves: string[]; pins: string[] }>({
    moves: [],
    pins: [],
  });
  const [moved, setMoved] = useState<Record<string, string>>({});
  const scale = useFitScale(0.4, 1080);
  const rootRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  // Element + its offset + pointer position at pointerdown (never movementX: #3508).
  const drag = useRef<{
    el: HTMLElement;
    x: number;
    y: number;
    cx: number;
    cy: number;
  } | null>(null);
  const pos = useRef(new WeakMap<HTMLElement, { x: number; y: number }>());

  const go = (d: number) => {
    const next = VKEYS[(VKEYS.indexOf(v) + d + VKEYS.length) % VKEYS.length]!;
    const q = new URLSearchParams(window.location.search);
    q.set("variant", next);
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

  const isMatch = !["news", "event"].includes(t);
  const item: LookItem | null =
    t === "news"
      ? (articles[articleIdx] ?? null)
      : t === "event"
        ? event
        : { ...matchItem(t, player), fallback: FALLBACK[look] };
  const canvasKey = `${look}-${t}-${articleIdx}-${format}-${theme}-${v}-${reset}`;
  const Look = look === "W" ? null : LOOKS[look]!.C;

  // Every combination starts from the default layout.
  useLayoutEffect(() => {
    pos.current = new WeakMap();
    const root = capRef.current;
    if (!root) return;
    if (look === "W") tagWedstrijd(root);
    const sel = `[data-move~="${v}"]`;
    const moves = [...root.querySelectorAll<HTMLElement>(sel)].map(
      (el) => el.dataset.name ?? "?",
    );
    const pins = [
      ...[...root.querySelectorAll<HTMLElement>("[data-pin]")].map(
        (el) => el.dataset.pin!,
      ),
      // A frame that moves only in another variant is pinned in this one.
      ...[...root.querySelectorAll<HTMLElement>("[data-move]")]
        .filter(
          (el) =>
            !el.matches(sel) &&
            !el.parentElement?.closest(sel) &&
            !el.querySelector(sel),
        )
        .map((el) => `${el.dataset.name} (vast hier)`),
    ];
    // Next frame: the DOM tags are read after paint, not set during the effect.
    const id = requestAnimationFrame(() =>
      setLegend({ moves, pins: [...new Set(pins)] }),
    );
    return () => cancelAnimationFrame(id);
  }, [canvasKey, look, v]);

  async function save() {
    const node = capRef.current;
    if (!node) return;
    setShow(false);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const opts = {
      width: 1080,
      height: format === "story" ? 1920 : 1080,
      pixelRatio: 1,
      includeQueryParams: true,
      cacheBust: true,
    };
    await toPng(node, opts); // iOS Safari warm-up, as in SharePage
    const url = await toPng(node, opts);
    setShow(true);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blocks-${canvasKey}.png`;
    a.click();
  }

  const H = format === "story" ? 1920 : 1080;
  const chip = (on: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    border: `1px solid ${TOKENS.ink}`,
    background: on ? TOKENS.ink : "#fff",
    color: on ? TOKENS.cream : TOKENS.ink,
    fontFamily: MONO_FONT,
    fontSize: 13,
    cursor: "pointer",
  });
  const sel = `[data-move~="${v}"]`;

  return (
    <div
      style={{
        padding: "16px 16px 120px",
        background: TOKENS.cream,
        minHeight: "100vh",
        fontFamily: MONO_FONT,
        fontSize: 13,
      }}
    >
      <style>{`
        #blk ${sel} { touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; cursor: grab; }
        #blk.show ${sel} { outline: 6px dashed #e11d48; outline-offset: 4px; }
        #blk.show [data-pin] { outline: 5px dotted rgba(37,99,235,0.8); outline-offset: -5px; }
        #blk [data-dragging] { outline: 10px solid #e11d48 !important; cursor: grabbing; }
      `}</style>
      <p style={{ margin: "0 0 12px", maxWidth: 640 }}>
        PROTOTYPE #3519 — welke blokken schuiven, per look en per template. Rood
        gestreept = schuift. Blauw gestippeld = ligt vast. Sleep met je vinger.
      </p>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}
      >
        {LOOK_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            style={chip(look === k)}
            onClick={() => setLook(k)}
          >
            {k} · {LOOK_NAME[k]}
          </button>
        ))}
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}
      >
        {TEMPLATES.map((x) => (
          <button
            key={x.key}
            type="button"
            style={chip(t === x.key)}
            onClick={() => setT(x.key)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}
      >
        {(["story", "square"] as const).map((x) => (
          <button
            key={x}
            type="button"
            style={chip(format === x)}
            onClick={() => setFormat(x)}
          >
            {x === "story" ? "9:16" : "1:1"}
          </button>
        ))}
        {look !== "W" &&
          (["light", "dark"] as const).map((x) => (
            <button
              key={x}
              type="button"
              style={chip(theme === x)}
              onClick={() => setTheme(x)}
            >
              {x === "light" ? "Licht" : "Donker"}
            </button>
          ))}
        {t === "news" && (
          <select
            value={articleIdx}
            onChange={(e) => setArticleIdx(Number(e.target.value))}
            style={chip(false)}
          >
            {articles.map((a, i) => (
              <option key={a.key} value={i}>
                {a.articleType}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          style={chip(show)}
          onClick={() => setShow((s) => !s)}
        >
          Randjes {show ? "aan" : "uit"}
        </button>
        <button
          type="button"
          style={chip(false)}
          onClick={() => setReset((r) => r + 1)}
        >
          Alles terugzetten
        </button>
        <button type="button" style={chip(false)} onClick={save}>
          PNG
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 1080 * scale,
            height: H * scale,
            overflow: "hidden",
            border: `1px solid ${TOKENS.paperEdge}`,
            background: "#fff",
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              id="blk"
              ref={rootRef}
              className={show ? "show" : undefined}
              onPointerDown={(e) => {
                const el = (e.target as HTMLElement).closest<HTMLElement>(sel);
                if (!el || !rootRef.current?.contains(el)) return;
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                const p = pos.current.get(el) ?? { x: 0, y: 0 };
                drag.current = { el, ...p, cx: e.clientX, cy: e.clientY };
                el.dataset.dragging = "1";
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d) return;
                const x = d.x + (e.clientX - d.cx) / scale;
                const y = d.y + (e.clientY - d.cy) / scale;
                // CSS `translate`, not `transform`: keeps each block's own rotate().
                d.el.style.translate = `${x}px ${y}px`;
                pos.current.set(d.el, { x, y });
              }}
              onPointerUp={() => {
                const d = drag.current;
                if (!d) return;
                delete d.el.dataset.dragging;
                const p = pos.current.get(d.el);
                if (p)
                  setMoved((m) => ({
                    ...m,
                    [`${canvasKey}|${d.el.dataset.name ?? "?"}`]: `${Math.round(p.x)}, ${Math.round(p.y)}`,
                  }));
                drag.current = null;
              }}
              onPointerCancel={() => {
                if (drag.current) delete drag.current.el.dataset.dragging;
                drag.current = null;
              }}
              onDragStart={(e) => e.preventDefault()}
            >
              <div key={canvasKey} ref={capRef}>
                <ThemeCtx.Provider value={theme}>
                  {look === "W" ? (
                    isMatch &&
                    (format === "story" ||
                      t === "kickoff" ||
                      t === "fulltime") ? (
                      <Wedstrijd t={t} f={format} player={player} />
                    ) : isMatch ? (
                      <Missing text="Bestaat vandaag niet in 1:1." f={format} />
                    ) : (
                      <Missing
                        text="Wedstrijd-look is alleen voor matchen."
                        f={format}
                      />
                    )
                  ) : item && Look ? (
                    <Look it={item} f={format} />
                  ) : (
                    <Missing text="Geen inhoud gevonden." f={format} />
                  )}
                </ThemeCtx.Provider>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 340,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div>
            <strong>Schuift ({legend.moves.length})</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
              {legend.moves.map((m, i) => (
                <li key={i}>
                  {m}
                  {moved[`${canvasKey}|${m}`]
                    ? ` → ${moved[`${canvasKey}|${m}`]}`
                    : ""}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Ligt vast</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
              {legend.pins.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
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
          whiteSpace: "nowrap",
        }}
      >
        <button
          type="button"
          onClick={() => go(-1)}
          style={{ padding: "10px 14px" }}
          aria-label="Vorige variant"
        >
          ←
        </button>
        <span style={{ minWidth: 170, textAlign: "center" }}>
          {v} · {VARIANTS[v]}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          style={{ padding: "10px 14px" }}
          aria-label="Volgende variant"
        >
          →
        </button>
      </div>
    </div>
  );
}

function Missing({ text, f }: { text: string; f: Format }) {
  return (
    <div
      style={{
        width: 1080,
        height: f === "story" ? 1920 : 1080,
        display: "grid",
        placeItems: "center",
        fontFamily: MONO_FONT,
        fontSize: 40,
        color: TOKENS.inkMuted,
        padding: 80,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}
