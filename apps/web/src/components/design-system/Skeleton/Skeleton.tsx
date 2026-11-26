import { cn } from "@/lib/utils/cn";

export type SkeletonTone = "cream" | "dark" | "deep";

export interface SkeletonProps {
  /**
   * Which field the placeholder sits on. `"cream"` (default) is the paper
   * register (`--color-cream` `#f5f1e6`); `"dark"` is the `jersey-deep-dark`
   * full-bleed register; `"deep"` is the `cream-deep` field (`#e1d7bf`, e.g.
   * `/tegenstander/[clubId]`'s root) — `paper-edge` is calibrated against
   * plain cream (an 8/5/2 RGB delta against `cream-deep`, invisible once
   * `animate-pulse` fades it to 50% opacity), so a bar sitting directly on a
   * `cream-deep` field needs this tone instead.
   */
  tone?: SkeletonTone;
  /** Sizing/position utilities only (`h-4 w-32`, `absolute inset-0`, …). */
  className?: string;
}

/**
 * `<Skeleton>` — the one primitive every loading skeleton composes a shimmer
 * placeholder from (#2432 §5/§6).
 *
 * It owns three things no call site may repeat by hand, because a per-div
 * opt-in is exactly how they went missing — wrong in 13 files (fill) and 13
 * files (the `motion-safe:` gate) of the pre-#2573 audit:
 *
 * - **Fill.** `paper-edge` on cream — the only one of six fills in production
 *   use far enough from the `#f5f1e6` cream field for `animate-pulse`'s 50%
 *   opacity fade to actually register (a `cream-soft` bar landed on a 4-unit
 *   colour shift, invisible). A matching translucent-cream tone for the dark
 *   field, and `ink/15` for the `cream-deep` field — the value this call
 *   site used before the primitive existed, kept because it is the one that
 *   was actually calibrated against `cream-deep`.
 * - **The `motion-safe:` gate** on `animate-pulse`, so a shimmer never
 *   animates under `prefers-reduced-motion`.
 * - **`aria-hidden="true"`**, so a bar never gets read by a screen reader —
 *   the loading state's one announcement lives on `<LoadingAnnouncement>`,
 *   never on the bars themselves.
 *
 * `className` supplies sizing and position only — never a fill or animation
 * utility, both already owned here. A card's real chrome (`<TapedCard>`,
 * `border-2 border-ink`, `shadow-paper-*`) stays real; `<Skeleton>` only fills
 * the content slots inside it (#2432 §7).
 */
const FILL_CLASS: Record<SkeletonTone, string> = {
  cream: "bg-paper-edge",
  dark: "bg-cream/20",
  deep: "bg-ink/15",
};

export const Skeleton = ({ tone = "cream", className }: SkeletonProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse", FILL_CLASS[tone], className)}
    />
  );
};
