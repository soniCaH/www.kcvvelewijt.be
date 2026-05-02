import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type StampBadgeTone = "jersey" | "ink" | "alert";
export type StampBadgePosition = "top-right" | "top-left";

export interface StampBadgeProps {
  children: ReactNode;
  rotation?: number;
  position?: StampBadgePosition;
  tone?: StampBadgeTone;
  className?: string;
}

const TONE_CLASS: Record<StampBadgeTone, string> = {
  // Jersey body, ink chrome (border + shadow stay ink across all tones —
  // mirrors the FOUT badge convention from #1571).
  jersey: "bg-jersey-deep text-cream",
  ink: "bg-ink text-cream",
  alert: "bg-alert text-white",
};

const POSITION_CLASS: Record<StampBadgePosition, string> = {
  // Mirrors the locked Phase 2.A.4 mockup — badge sits 14px above the
  // parent edge with a 36px inset from the side it anchors to.
  "top-right": "-top-[14px] right-9",
  "top-left": "-top-[14px] left-9",
};

/**
 * StampBadge — content-bearing, rotated, paper-shadowed label that pins
 * to a `position: relative` parent (e.g. <ClippedCard>). Distinct from
 * <TapeStrip> (graphical washi-tape) — this stamp carries text.
 *
 * Children can include a leading glyph (★ / ✱) inline; promote to a
 * dedicated `glyph?` prop only if ≥ 2 consumers want it.
 */
export function StampBadge({
  children,
  rotation = 2,
  position = "top-right",
  tone = "jersey",
  className,
}: StampBadgeProps) {
  return (
    <span
      data-component="stamp-badge"
      data-tone={tone}
      data-position={position}
      style={{ transform: `rotate(${rotation}deg)` } as CSSProperties}
      className={cn(
        "absolute z-[2] inline-block px-3.5 py-1.5",
        "border-ink border-[1.5px] shadow-[4px_4px_0_0_var(--color-ink)]",
        "font-mono text-[11px] font-bold tracking-[0.1em] uppercase",
        TONE_CLASS[tone],
        POSITION_CLASS[position],
        className,
      )}
    >
      {children}
    </span>
  );
}
