"use client";

// PROTOTYPE (#3508) — throwaway. Answers: what is a "section", which ones move,
// is reorder enough or is free positioning wanted, and does a rearranged
// layout still capture cleanly with html-to-image (incl. the iOS warm-up).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "../constants";
import { ShareFrame, ShareFoot, ShareMid, ShareTop } from "../shared/ShareFrame";
import {
  CrestMatchup,
  Dash,
  GhostLetter,
  Kicker,
  Meta,
  Seam,
  ShareName,
} from "../shared/ShareElements";
import { resolveCrests, splitMatchName } from "../shared/theme";

// ── Fixture ────────────────────────────────────────────────────────────────
const MATCH = "KCVV Elewijt — FC Dummy";
const COMPETITION = "3de Provinciale B";
const DATE_TIME = "Zaterdag · 20:00 · Terrein A";
const AWAY_LOGO = "/images/logos/clubs/dummy-rouge.svg";

type SectionId = "kicker" | "crests" | "names" | "date";
const DEFAULT_ORDER: SectionId[] = ["kicker", "crests", "names", "date"];
const LABELS: Record<SectionId, string> = {
  kicker: "Kicker — Aftrap · competitie",
  crests: "Clublogo's",
  names: "Ploegnamen",
  date: "Datum · uur · terrein",
};

// The original template spaces with per-element margins that assume a fixed
// order (crests "56px 0 64px", seam "72px 0 48px"). Reordering forces one
// uniform gap instead — finding #1 of this prototype.
function Section({ id }: { id: SectionId }) {
  const { home, away } = splitMatchName(MATCH);
  switch (id) {
    case "kicker":
      return <Kicker>{`Aftrap · ${COMPETITION}`}</Kicker>;
    case "crests":
      return (
        <CrestMatchup
          crests={resolveCrests(MATCH, undefined, AWAY_LOGO)}
          size={300}
        />
      );
    case "names":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <ShareName fontSize={124}>{home}</ShareName>
          <Dash style={{ margin: "12px 0" }} />
          <ShareName fontSize={124} accent>
            {away}
          </ShareName>
        </div>
      );
    case "date":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "48px",
            width: "100%",
          }}
        >
          <Seam width="78%" />
          <Meta>{DATE_TIME}</Meta>
        </div>
      );
  }
}

/** Kickoff (cream) with the movable middle; top crest, footer, frame and ghost "vs" stay pinned. */
function KickoffFrame({ children }: { children: React.ReactNode }) {
  return (
    <ShareFrame
      width={CAPTURE_WIDTH}
      height={CAPTURE_HEIGHT}
      register="cream"
      decor={
        <GhostLetter
          fontSize={1200}
          style={{ right: "-110px", bottom: "-140px" }}
        >
          vs
        </GhostLetter>
      }
    >
      <ShareTop />
      <ShareMid center style={{ gap: "64px" }}>
        {children}
      </ShareMid>
      <ShareFoot align="center" />
    </ShareFrame>
  );
}

// ── Capture (copied from SharePage.handleGenerate) ─────────────────────────
function useCapture() {
  const ref = useRef<HTMLDivElement>(null);
  const [png, setPng] = useState<string | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generate = async () => {
    if (!ref.current) return;
    setError(null);
    const t0 = performance.now();
    try {
      const opts = {
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        pixelRatio: 1,
        includeQueryParams: true,
      };
      await toPng(ref.current, opts); // iOS warm-up, thrown away
      setPng(await toPng(ref.current, opts));
      setMs(Math.round(performance.now() - t0));
    } catch (e) {
      setError(String(e));
    }
  };
  return { ref, png, ms, error, generate };
}

function Preview({
  scale,
  captureRef,
  children,
}: {
  scale: number;
  captureRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: CAPTURE_WIDTH * scale,
        height: CAPTURE_HEIGHT * scale,
        overflow: "hidden",
        flexShrink: 0,
      }}
      className="border-ink border-2"
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div ref={captureRef}>{children}</div>
      </div>
    </div>
  );
}

function CaptureColumn({
  cap,
  state,
}: {
  cap: ReturnType<typeof useCapture>;
  state: unknown;
}) {
  return (
    <div className="flex flex-col gap-3" style={{ width: 324 }}>
      <button
        type="button"
        onClick={cap.generate}
        className="bg-ink text-cream px-4 py-2 font-mono text-sm uppercase"
      >
        Genereer PNG
      </button>
      {cap.ms !== null && (
        <p className="font-mono text-xs">Capture: {cap.ms} ms (2× toPng)</p>
      )}
      {cap.error && <p className="text-card-red font-mono text-xs">{cap.error}</p>}
      {cap.png && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cap.png} alt="Gegenereerde PNG" className="border-ink border-2" />
      )}
      <pre className="bg-ink/5 p-2 font-mono text-xs whitespace-pre-wrap">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ── Variant A: a list beside the preview (HTML5 drag + ↑/↓ buttons) ────────
function VariantA() {
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const cap = useCapture();
  return (
    <div className="flex flex-wrap items-start gap-6">
      <ol className="flex w-72 flex-col gap-2 font-mono text-sm">
        <li className="border-ink/30 border-2 border-dashed p-3 opacity-60">
          🔒 Clublogo bovenaan (vast)
        </li>
        {order.map((id, i) => (
          <li
            key={id}
            draggable
            onDragStart={() => setDragFrom(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom !== null) setOrder(move(order, dragFrom, i));
              setDragFrom(null);
            }}
            className={`border-ink flex cursor-grab items-center gap-2 border-2 bg-white p-3 ${dragFrom === i ? "opacity-40" : ""}`}
          >
            <span aria-hidden>⠿</span>
            <span className="flex-1">{LABELS[id]}</span>
            <button
              type="button"
              disabled={i === 0}
              onClick={() => setOrder(move(order, i, i - 1))}
              className="px-1 disabled:opacity-20"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={i === order.length - 1}
              onClick={() => setOrder(move(order, i, i + 1))}
              className="px-1 disabled:opacity-20"
            >
              ↓
            </button>
          </li>
        ))}
        <li className="border-ink/30 border-2 border-dashed p-3 opacity-60">
          🔒 kcvvelewijt.be onderaan (vast)
        </li>
        <button
          type="button"
          onClick={() => setOrder(DEFAULT_ORDER)}
          className="mt-2 text-left underline"
        >
          Standaardvolgorde
        </button>
      </ol>
      <Preview scale={0.3} captureRef={cap.ref}>
        <KickoffFrame>
          {order.map((id) => (
            <Section key={id} id={id} />
          ))}
        </KickoffFrame>
      </Preview>
      <CaptureColumn cap={cap} state={{ order }} />
    </div>
  );
}

// ── Variant B: drag the blocks on the preview itself (pointer events, works on touch) ──
function VariantB() {
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [dragging, setDragging] = useState<SectionId | null>(null);
  const els = useRef(new Map<SectionId, HTMLDivElement>());
  const cap = useCapture();

  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const others = order.filter((id) => id !== dragging);
    const index = others.filter((id) => {
      const r = els.current.get(id)!.getBoundingClientRect();
      return r.top + r.height / 2 < e.clientY;
    }).length;
    const next = [...others];
    next.splice(index, 0, dragging);
    if (next.join() !== order.join()) setOrder(next);
  };

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex flex-col gap-2">
        <p className="max-w-[432px] font-mono text-xs">
          Sleep een blok in de preview omhoog of omlaag. Logo bovenaan en
          website onderaan liggen vast.
        </p>
        <Preview scale={0.4} captureRef={cap.ref}>
          <KickoffFrame>
            {order.map((id) => (
              <div
                key={id}
                ref={(el) => {
                  if (el) els.current.set(id, el);
                }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragging(id);
                }}
                onPointerMove={onMove}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                style={{
                  cursor: dragging === id ? "grabbing" : "grab",
                  touchAction: "none",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  // drag feedback only while dragging, so it never lands in the PNG
                  outline: dragging === id ? "8px dashed #c0392b" : undefined,
                  outlineOffset: "16px",
                }}
              >
                <Section id={id} />
              </div>
            ))}
          </KickoffFrame>
        </Preview>
        <button
          type="button"
          onClick={() => setOrder(DEFAULT_ORDER)}
          className="self-start font-mono text-sm underline"
        >
          Standaardvolgorde
        </button>
      </div>
      <CaptureColumn cap={cap} state={{ order, dragging }} />
    </div>
  );
}

// ── Variant C: free positioning — drag any block anywhere ──────────────────
type Offsets = Record<SectionId, { x: number; y: number }>;
const ZERO: Offsets = {
  kicker: { x: 0, y: 0 },
  crests: { x: 0, y: 0 },
  names: { x: 0, y: 0 },
  date: { x: 0, y: 0 },
};
const C_SCALE = 0.4;

function VariantC() {
  const [offsets, setOffsets] = useState(ZERO);
  const [dragging, setDragging] = useState<SectionId | null>(null);
  // Offset + pointer position at pointerdown; movementX is 0 on some synthetic/touch moves.
  const start = useRef({ x: 0, y: 0, cx: 0, cy: 0 });
  const cap = useCapture();
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex flex-col gap-2">
        <p className="max-w-[432px] font-mono text-xs">
          Sleep een blok waar je wil — ook schuin, ook over elkaar. Logo en
          website liggen vast.
        </p>
        <Preview scale={C_SCALE} captureRef={cap.ref}>
          <KickoffFrame>
            {DEFAULT_ORDER.map((id) => (
              <div
                key={id}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  start.current = {
                    ...offsets[id],
                    cx: e.clientX,
                    cy: e.clientY,
                  };
                  setDragging(id);
                }}
                onPointerMove={(e) => {
                  if (dragging !== id) return;
                  const s = start.current;
                  setOffsets((o) => ({
                    ...o,
                    [id]: {
                      x: s.x + (e.clientX - s.cx) / C_SCALE,
                      y: s.y + (e.clientY - s.cy) / C_SCALE,
                    },
                  }));
                }}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                style={{
                  cursor: dragging === id ? "grabbing" : "grab",
                  touchAction: "none",
                  position: "relative",
                  zIndex: dragging === id ? 2 : 1,
                  transform: `translate(${offsets[id].x}px, ${offsets[id].y}px)`,
                  outline: dragging === id ? "8px dashed #c0392b" : undefined,
                  outlineOffset: "16px",
                }}
              >
                <Section id={id} />
              </div>
            ))}
          </KickoffFrame>
        </Preview>
        <button
          type="button"
          onClick={() => setOffsets(ZERO)}
          className="self-start font-mono text-sm underline"
        >
          Alles terugzetten
        </button>
      </div>
      <CaptureColumn
        cap={cap}
        state={Object.fromEntries(
          DEFAULT_ORDER.map((id) => [
            id,
            { x: Math.round(offsets[id].x), y: Math.round(offsets[id].y) },
          ]),
        )}
      />
    </div>
  );
}

// ── Switcher ───────────────────────────────────────────────────────────────
const VARIANTS = {
  A: { name: "Lijst naast de preview", C: VariantA },
  B: { name: "Slepen op de preview", C: VariantB },
  C: { name: "Vrij plaatsen", C: VariantC },
} as const;
type Key = keyof typeof VARIANTS;
const KEYS = Object.keys(VARIANTS) as Key[];

export function DragPrototype({ variant }: { variant: string }) {
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
        Prototype #3508 — secties herschikken (Aftrap-story)
      </h1>
      {/* key: reset each variant's state on switch */}
      <Variant key={current} />
      <div className="bg-ink text-cream fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 px-5 py-3 font-mono text-sm shadow-xl">
        <button type="button" onClick={() => go(-1)} aria-label="Vorige variant">
          ←
        </button>
        <span>
          {current} ({VARIANTS[current].name})
        </span>
        <button type="button" onClick={() => go(1)} aria-label="Volgende variant">
          →
        </button>
      </div>
    </main>
  );
}
