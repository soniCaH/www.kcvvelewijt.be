"use client";

/** PROTOTYPE — throwaway. Do not ship. See #3911. */

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface PrototypeToggle {
  /** Search param it drives, e.g. "code". */
  param: string;
  label: string;
  /** Values in cycle order; the first is the default. */
  options: readonly string[];
  current: string;
}

export interface PrototypeSwitcherProps {
  /** Variant keys in cycle order, e.g. ["A","B","C"]. */
  variants: readonly string[];
  /** Current variant key. */
  current: string;
  /** Optional human name per key, e.g. { A: "Plain Page" }. */
  names?: Record<string, string>;
  /** Extra search params the bar can flip, one button each. */
  toggles?: readonly PrototypeToggle[];
}

const CELL = "border-ink px-3 py-2 hover:bg-ink hover:text-cream";

export const PrototypeSwitcher = ({
  variants,
  current,
  names,
  toggles = [],
}: PrototypeSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const go = useCallback(
    (delta: number) => {
      const i = variants.indexOf(current);
      const next = variants[(i + delta + variants.length) % variants.length];
      if (next) setParam("variant", next);
    },
    [variants, current, setParam],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (process.env.NODE_ENV === "production") return null;

  const label = names?.[current] ? `${current} — ${names[current]}` : current;

  return (
    <div className="border-ink bg-cream text-label shadow-paper-md fixed bottom-5 left-1/2 z-[9999] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-stretch border-2 font-mono">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Vorige variant"
        className={`${CELL} border-r-2`}
      >
        ←
      </button>
      <span className="flex items-center gap-2 px-3 py-2 whitespace-nowrap uppercase">
        <b className="bg-warm px-1.5">proto</b>
        {label}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Volgende variant"
        className={`${CELL} border-l-2`}
      >
        →
      </button>
      {toggles.map((t) => {
        const next =
          t.options[(t.options.indexOf(t.current) + 1) % t.options.length];
        return (
          <button
            key={t.param}
            type="button"
            onClick={() => next && setParam(t.param, next)}
            aria-label={`${t.label}: ${t.current}, wissel naar ${next}`}
            className={`${CELL} border-l-2 whitespace-nowrap uppercase`}
          >
            {t.label}: <b>{t.current}</b>
          </button>
        );
      })}
    </div>
  );
};
