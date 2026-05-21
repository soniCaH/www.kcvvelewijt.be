import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { TapedCard, type TapedCardProps } from "../TapedCard";
import type { TapeStripProps } from "../TapeStrip/TapeStrip";

export type TapedFigureAspect =
  | "landscape-16-9"
  | "landscape-3-2"
  | "square"
  | "portrait-3-4"
  | "auto";

export type TapedFigureBg = "cream" | "cream-soft";

/**
 * Internal padding between the TapedCard edge and the photo.
 * - `"sm"` (default) — polaroid margin (cream/paper visible around the
 *   photo). Right for editorial photography embedded in body content.
 * - `"none"` — full-bleed photo flush to the TapedCard's `border-2
 *   border-ink` outline. Right when the figure IS the surface (e.g.
 *   `<PlayerHero>`) and a transparent-cutout image must not appear to
 *   float on a cream backdrop.
 *
 * Other TapedCard padding values are intentionally not exposed — the
 * polaroid / full-bleed split is the only meaningful contrast here.
 */
export type TapedFigurePadding = "sm" | "none";

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
  padding?: TapedFigurePadding;
  className?: string;
}

const ASPECT_VALUE: Record<Exclude<TapedFigureAspect, "auto">, string> = {
  "landscape-16-9": "16 / 9",
  "landscape-3-2": "3 / 2",
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
  padding = "sm",
  className,
}: TapedFigureProps) {
  const aspectStyle: CSSProperties =
    aspect === "auto" ? {} : { aspectRatio: ASPECT_VALUE[aspect] };

  const showFigcaption = Boolean(caption || credit);

  // `data-tint` is read by the global `.taped-figure[data-tint]` rule
  // in globals.css. Forwarded onto the TapedCard root so the same
  // element anchors the `> .taped-figure__photo` selectors and the
  // `::after` grain overlay.
  const figureAttrs: Record<`data-${string}`, string> = {
    "data-tint": tint,
  };

  return (
    <TapedCard
      as="figure"
      rotation={rotation}
      tape={tape}
      bg={bg}
      padding={padding}
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
