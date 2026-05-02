import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ClippedCardAs = "div" | "article" | "section" | "figure";

export interface ClippedCardProps {
  children: ReactNode;
  className?: string;
  as?: ClippedCardAs;
}

/**
 * ClippedCard — bordered "archival document" paper card with TL + BR
 * L-shaped corner-clip accents. No offset shadow, no rotation. Distinct
 * mood from <TapedCard> (loose paper / casual notice).
 *
 * The L-marks are an internal implementation detail rendered by the
 * private <CornerClipDecoration> subcomponent; they are not exposed
 * separately. Using a corner-clipped + bordered + no-shadow + no-rotation
 * card means using <ClippedCard> — anyone reaching for "rotation",
 * "shadow", or "tape" should use <TapedCard> instead.
 */
export function ClippedCard({
  children,
  className,
  as: Tag = "div",
}: ClippedCardProps) {
  const Component = Tag as ElementType;
  return (
    <Component
      data-component="clipped-card"
      className={cn(
        // Surface is white to match the locked Phase 2.A.4 mockup —
        // a sheet of paper sitting on the cream page backdrop.
        "border-ink text-ink relative border-2 bg-white",
        // Opinionated default padding mirrors the locked mockup
        // (`36px 40px 28px`). Override via `className`.
        "px-10 pt-9 pb-7",
        className,
      )}
    >
      <CornerClipDecoration corner="tl" />
      <CornerClipDecoration corner="br" />
      {children}
    </Component>
  );
}

interface CornerClipDecorationProps {
  corner: "tl" | "br";
}

/**
 * Private — not exported. The L-mark accent that sits *outside* the
 * card's border edge (translated 6px outward on both axes) and renders
 * only the relevant two sides per corner.
 */
function CornerClipDecoration({ corner }: CornerClipDecorationProps) {
  const isTl = corner === "tl";
  return (
    <span
      aria-hidden="true"
      data-corner-clip={corner}
      className={cn(
        "border-ink pointer-events-none absolute h-[18px] w-[18px] border-2",
        isTl
          ? "-top-[2px] -left-[2px] -translate-x-[6px] -translate-y-[6px] border-r-0 border-b-0"
          : "-right-[2px] -bottom-[2px] translate-x-[6px] translate-y-[6px] border-t-0 border-l-0",
      )}
    />
  );
}
