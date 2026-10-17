"use client";
// PROTOTYPE — throwaway. Floating bar to flip ?variant= on /hulp.
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const VARIANTS = [
  { key: "huidig", label: "Huidig (live)" },
  { key: "A", label: "A · eerste versie" },
  { key: "A1", label: "A1 · Clubboek" },
  { key: "A2", label: "A2 · Smoelenboek" },
  { key: "A3", label: "A3 · Per pijler" },
  { key: "A4", label: "A4 · Bouwplan" },
  { key: "A5", label: "A5 · Kaartenbak" },
  { key: "A6", label: "A6 · Wegwijzer" },
  { key: "A7", label: "A7 · Mix 1+5+6" },
  { key: "B", label: "B · Van top naar ploeg" },
] as const;

export function PrototypeSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const idx = Math.max(
    0,
    VARIANTS.findIndex((v) => v.key === current),
  );

  const go = (step: number) => {
    const next = VARIANTS[(idx + step + VARIANTS.length) % VARIANTS.length];
    router.replace(`${pathname}?variant=${next.key}#structuur`, {
      scroll: false,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable], [role=dialog]"))
        return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="bg-ink text-cream fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 px-2 py-2 font-mono text-xs shadow-lg">
      <button
        type="button"
        onClick={() => go(-1)}
        className="px-3 py-1 hover:opacity-70"
        aria-label="Vorige variant"
      >
        ←
      </button>
      <span className="min-w-[22ch] text-center">{VARIANTS[idx].label}</span>
      <button
        type="button"
        onClick={() => go(1)}
        className="px-3 py-1 hover:opacity-70"
        aria-label="Volgende variant"
      >
        →
      </button>
    </div>
  );
}
