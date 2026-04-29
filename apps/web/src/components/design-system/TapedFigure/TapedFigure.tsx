import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { TapedCard, type TapedCardProps } from "../TapedCard";

export type TapedFigureAspect =
  | "landscape-16-9"
  | "square"
  | "portrait-3-4"
  | "auto";

export type TapedFigureBg = "cream" | "cream-soft";

export interface TapedFigureProps {
  /** The image element to render inside the polaroid frame. Caller decides next/image, plain <img>, SanityImage, etc. */
  children: ReactNode;
  /** Documentation prop — the rendered image element owns the actual alt attribute. */
  alt?: string;
  aspect?: TapedFigureAspect;
  caption?: string;
  credit?: string;
  rotation?: TapedCardProps["rotation"];
  tape?: TapedCardProps["tape"];
  bg?: TapedFigureBg;
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
  className,
}: TapedFigureProps) {
  const aspectStyle: CSSProperties =
    aspect === "auto" ? {} : { aspectRatio: ASPECT_VALUE[aspect] };

  const showFigcaption = Boolean(caption || credit);

  return (
    <TapedCard
      as="figure"
      rotation={rotation}
      tape={tape}
      bg={bg}
      padding="sm"
      className={cn("block w-full", className)}
    >
      <div
        data-aspect={aspect}
        style={aspectStyle}
        className="relative w-full overflow-hidden"
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
