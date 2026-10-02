"use client";

/**
 * PROTOTYPE — #2501, throwaway. Lives on `prototype/2501-match-travel` only.
 *
 * Question: should a tapped fixture row travel into the match hero?
 * Four variants, picked from the floating bar (stored in localStorage so the
 * choice survives the navigation it is judging):
 *   A — cut       today's behaviour, no transition at all
 *   B — card      the whole tapped row grows into the hero card
 *   C — score     only the score/time slot travels into the hero headline
 *   D — fade      no shared element, the whole page cross-fades
 * Plus a speed: 150 / 300 / 500 ms (DESIGN.md's three speeds), ease-out.
 *
 * Only the TAPPED row carries a view-transition name (set on click), because
 * the same match can sit in the strip and in a list on one page, and two
 * equal names make the browser skip the transition.
 */

import { ViewTransition, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Variant = "A" | "B" | "C" | "D";
type Part = "card" | "score";
const VARIANTS: Variant[] = ["A", "B", "C", "D"];
const NAMES: Record<Variant, string> = {
  A: "cut (today)",
  B: "card travels",
  C: "score travels",
  D: "page fade",
};
const SPEEDS = [150, 300, 500];

let variant: Variant = "A";
let speed = 300;
let active: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

if (typeof window !== "undefined") {
  try {
    variant = (localStorage.getItem("vt-variant") as Variant) || "A";
    speed = Number(localStorage.getItem("vt-speed")) || 300;
  } catch {}
}

const snapshot = () => `${variant}|${speed}|${active}`;
function useStore() {
  useSyncExternalStore(subscribe, snapshot, () => "A|300|null");
  return { variant, speed, active };
}

/** Call from the row's onClick — marks this match as the one travelling. */
export function markTravelSource(matchId: number | string) {
  active = String(matchId);
  emit();
}

function partFor(v: Variant): Part | null {
  return v === "B" ? "card" : v === "C" ? "score" : null;
}

/** Wraps one element of a fixture row (source side). */
export function TravelSource({
  matchId,
  part,
  children,
}: {
  matchId: number | string;
  part: Part;
  children: ReactNode;
}) {
  const s = useStore();
  const pathname = usePathname();
  const on =
    partFor(s.variant) === part &&
    s.active === String(matchId) &&
    pathname !== `/wedstrijd/${matchId}`;
  return on ? (
    <ViewTransition name={`travel-${part}`}>{children}</ViewTransition>
  ) : (
    children
  );
}

/** Wraps one element of the match hero (destination side). */
export function TravelDest({
  part,
  children,
}: {
  part: Part;
  children: ReactNode;
}) {
  const s = useStore();
  return partFor(s.variant) === part ? (
    <ViewTransition name={`travel-${part}`}>{children}</ViewTransition>
  ) : (
    children
  );
}

/**
 * Mounted once in the layout. Variant D needs React to start a view
 * transition on every navigation, so it wraps the page in a boundary.
 */
export function TravelPageBoundary({ children }: { children: ReactNode }) {
  const s = useStore();
  return s.variant === "D" ? (
    <ViewTransition>{children}</ViewTransition>
  ) : (
    children
  );
}

export function TravelSwitcher() {
  const s = useStore();
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PUBLIC_VT_PROTO
  )
    return null;
  const set = (v: Variant, ms: number) => {
    variant = v;
    speed = ms;
    try {
      localStorage.setItem("vt-variant", v);
      localStorage.setItem("vt-speed", String(ms));
    } catch {}
    emit();
  };
  const i = VARIANTS.indexOf(s.variant);
  const cycle = (d: number) => set(VARIANTS[(i + d + 4) % 4], s.speed);
  return (
    <>
      <style>{`
        ::view-transition-group(*),
        ::view-transition-old(*),
        ::view-transition-new(*) {
          animation-duration: ${s.speed}ms;
          animation-timing-function: ease-out;
        }
        /* Variants A–C: the rest of the page cuts, only named parts move. */
        ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
        /* Same as the site's reduced-motion rule: no travel at all. */
        @media (prefers-reduced-motion: reduce) {
          ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "#111",
          color: "#fff",
          font: "12px/1 ui-monospace, monospace",
          padding: "8px 10px",
          borderRadius: 999,
          display: "flex",
          gap: 8,
          alignItems: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,.4)",
        }}
      >
        <button onClick={() => cycle(-1)} aria-label="Previous variant">
          ←
        </button>
        <span>
          {s.variant} — {NAMES[s.variant]}
        </span>
        <button onClick={() => cycle(1)} aria-label="Next variant">
          →
        </button>
        <span style={{ opacity: 0.5 }}>|</span>
        {SPEEDS.map((ms) => (
          <button
            key={ms}
            onClick={() => set(s.variant, ms)}
            style={{
              fontWeight: ms === s.speed ? 700 : 400,
              opacity: ms === s.speed ? 1 : 0.6,
            }}
          >
            {ms}
          </button>
        ))}
      </div>
    </>
  );
}
