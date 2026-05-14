import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { TapedCard, type TapedCardProps } from "../TapedCard";
import type { TapeStripProps } from "../TapeStrip/TapeStrip";

export type TapedFigureAspect =
  | "landscape-16-9"
  | "square"
  | "portrait-3-4"
  | "auto";

export type TapedFigureBg = "cream" | "cream-soft";

/**
 * Per-instance warm-tint control.
 * - `"newsprint"` (default) — applies `--filter-photo-newsprint` via the
 *   global `.taped-figure` rule. Right for editorial photography.
 * - `"none"` — opts out (designed graphics or transparent cutouts where
 *   the sepia/hue-rotate would shift brand colours).
 */
export type TapedFigureTint = "newsprint" | "none";

export interface TapedFigureProps {
  /** The image element to render inside the polaroid frame. Caller decides next/image, plain <img>, SanityImage, etc. */
  children: ReactNode;
  /** Documentation prop — the rendered image element owns the actual alt attribute. */
  alt?: string;
  aspect?: TapedFigureAspect;
  caption?: string;
  credit?: string;
  rotation?: TapedCardProps["rotation"];
  /** A single tape strip. Hard-capped at one per photo by design — the
   *  two-strip slot cycle in the R9 first-pass lock was reviewed and
   *  rejected; surfaces that want a "no tape at all" look just omit
   *  this prop. */
  tape?: TapeStripProps;
  bg?: TapedFigureBg;
  tint?: TapedFigureTint;
  /** Opt-in layered hover (R9 §7 Variant A) — card press-down + photo
   *  lift. Composes with the underlying <TapedCard interactive="press">
   *  so rotation is preserved on hover. */
  interactive?: boolean;
  className?: string;
}

const ASPECT_VALUE: Record<Exclude<TapedFigureAspect, "auto">, string> = {
  "landscape-16-9": "16 / 9",
  square: "1 / 1",
  "portrait-3-4": "3 / 4",
};

export function TapedFigure({
  children,
  aspect = "landscape-16-9",
  caption,
  credit,
  rotation,
  tape,
  bg = "cream",
  tint = "newsprint",
  interactive = false,
  className,
}: TapedFigureProps) {
  const aspectStyle: CSSProperties =
    aspect === "auto" ? {} : { aspectRatio: ASPECT_VALUE[aspect] };

  const showFigcaption = Boolean(caption || credit);

  // `data-tint` and `data-lift` are read by the global `.taped-figure`
  // rules in globals.css. Forwarded onto the TapedCard root so the
  // same element anchors the `> .taped-figure__photo` selectors and
  // the `::after` grain overlay.
  const figureAttrs: Record<`data-${string}`, string> = {
    "data-tint": tint,
    "data-lift": interactive ? "true" : "false",
  };

  return (
    <TapedCard
      as="figure"
      rotation={rotation}
      tape={tape}
      bg={bg}
      padding="sm"
      interactive={interactive ? "press" : false}
      className={cn("taped-figure block w-full", className)}
      dataAttrs={figureAttrs}
    >
      <div
        data-aspect={aspect}
        style={aspectStyle}
        className="taped-figure__photo relative w-full overflow-hidden"
      >
        {children}
      </div>
      {showFigcaption && (
        <figcaption className="text-body-sm mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {caption && <span className="text-ink-soft">{caption}</span>}
          {credit && (
            <span className="text-mono-sm text-ink-muted ml-auto font-mono tracking-[0.06em] uppercase">
              {credit}
            </span>
          )}
        </figcaption>
      )}
    </TapedCard>
  );
}
