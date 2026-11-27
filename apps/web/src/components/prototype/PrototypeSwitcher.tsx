"use client";

// PROTOTYPE (#3656) — throwaway variant switcher. Never merge to main.
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface PrototypeSwitcherProps {
  variants: { key: string; name: string }[];
}

export const PrototypeSwitcher = ({ variants }: PrototypeSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("variant") ?? variants[0].key;
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  const go = (step: number) => {
    const next = variants[(index + step + variants.length) % variants.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next.key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 font-mono text-sm whitespace-nowrap text-white shadow-2xl"
      style={{ background: "#c026d3" }} // off-palette on purpose: not part of the design
    >
      <button type="button" onClick={() => go(-1)} aria-label="Vorige variant">
        ‹
      </button>
      <span>
        {variants[index].key} ({variants[index].name})
      </span>
      <button type="button" onClick={() => go(1)} aria-label="Volgende variant">
        ›
      </button>
    </div>
  );
};
