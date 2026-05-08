// apps/web/src/components/article/NewsCard/NewsCard.tsx
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Calendar, Clock, ExternalLink } from "@/lib/icons";

export type NewsCardAspectRatio = "landscape-16-9" | "square" | "portrait-3-4";
export type NewsCardRotation = "a" | "b" | "c" | "d" | "none";

export interface NewsCardProps {
  title: string;
  href?: string; // now optional — cards without href are non-interactive
  imageUrl?: string;
  imageAlt?: string;
  /** Single category label — shown above title and in footer */
  badge?: string;
  date?: string;
  /** ISO datetime or formatted string for event date (shown with Calendar icon) */
  eventDate?: string;
  /** HH:MM time string for events (shown with Clock icon) */
  eventTime?: string;
  /** Countdown label shown in footer chip (e.g. "over 33 dagen") */
  countdown?: string;
  /** When true, full-card link opens in new tab with ExternalLink indicator */
  isExternal?: boolean;
  variant?: "standard" | "featured" | "listing";
  /**
   * Aspect ratio of the card surface (standard/featured) or inner image
   * wrapper (listing). Defaults to 16:9 per the locked NewsGrid spec —
   * `<NewsGrid>` (#1672) and other Phase 4 consumers rely on this default.
   * Pre-redesign callers (`/nieuws` archive, `<RelatedContentSection>`)
   * pick up 16:9 too; their full retro-terrace rebuild is Phase 5+ scope.
   */
  aspectRatio?: NewsCardAspectRatio;
  /**
   * Phase 4 / NewsGrid — applies a small slot-deterministic rotation using
   * the shared `--rotate-tape-{a,b,c,d}` tokens. Default `"none"` preserves
   * existing rendering (no transform).
   */
  rotation?: NewsCardRotation;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}

const ASPECT_CLASS: Record<NewsCardAspectRatio, string> = {
  "landscape-16-9": "aspect-video",
  square: "aspect-square",
  "portrait-3-4": "aspect-[3/4]",
};

const ROTATION_VAR: Record<Exclude<NewsCardRotation, "none">, string> = {
  a: "var(--rotate-tape-a)",
  b: "var(--rotate-tape-b)",
  c: "var(--rotate-tape-c)",
  d: "var(--rotate-tape-d)",
};

export const NewsCard = ({
  title,
  href,
  imageUrl,
  imageAlt,
  badge,
  date,
  eventDate,
  eventTime,
  countdown,
  isExternal,
  variant = "standard",
  aspectRatio = "landscape-16-9",
  rotation = "none",
  as: Heading = "h3",
  className,
}: NewsCardProps) => {
  const isFeatured = variant === "featured";
  const isListing = variant === "listing";

  const aspectClass = ASPECT_CLASS[aspectRatio];

  const rotationStyle: CSSProperties | undefined =
    rotation !== "none"
      ? { transform: `rotate(${ROTATION_VAR[rotation]})` }
      : undefined;

  if (isListing) {
    return (
      <article
        data-rotation={rotation}
        data-aspect={aspectRatio}
        style={rotationStyle}
        className={cn(
          "group rounded-card relative flex h-full flex-col overflow-hidden bg-white",
          href &&
            "hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1",
          className,
        )}
      >
        {/* Green top-border: hidden by default, expands from center on hover */}
        {href && (
          <div
            className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
            aria-hidden="true"
          />
        )}

        {/* Full-card link */}
        {href && (
          <Link
            href={href}
            className="absolute inset-0 z-10"
            aria-label={title}
            {...(isExternal
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          />
        )}

        {/* Image area — stacked on top */}
        {imageUrl ? (
          <div
            className={cn("relative overflow-hidden", aspectClass)}
            data-testid="listing-image"
          >
            <Image
              src={imageUrl}
              alt={imageAlt ?? title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ) : (
          <div
            className={cn("bg-kcvv-green-dark", aspectClass)}
            aria-hidden="true"
            data-testid="listing-image-fallback"
          />
        )}

        {/* Content below image */}
        <div className="pointer-events-none flex flex-1 flex-col p-4">
          {badge && (
            <span className="border-kcvv-green-bright text-kcvv-green-bright mb-2 block border-l-2 pl-2 text-xs font-bold tracking-wider uppercase">
              {badge}
            </span>
          )}

          <div className="flex-1">
            <Heading className="font-body text-kcvv-black! group-hover:text-kcvv-black/75! mb-0! line-clamp-3 text-base! leading-snug! font-bold! transition-colors">
              {title}
            </Heading>
          </div>

          {date && (
            <div className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-500">
              <time>{date}</time>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      data-rotation={rotation}
      data-aspect={aspectRatio}
      style={rotationStyle}
      className={cn(
        "group rounded-card bg-kcvv-black relative overflow-hidden",
        href &&
          "hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1",
        aspectClass,
        className,
      )}
    >
      {/* Green top-border: hidden by default, expands from center on hover */}
      {href && (
        <div
          className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
          aria-hidden="true"
        />
      )}

      {/* Full-card link — click target only, text sits outside */}
      {href && (
        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={title}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        />
      )}

      {/* Background image */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt ?? title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={
            isFeatured
              ? "(max-width: 768px) 100vw, 66vw"
              : "(max-width: 768px) 100vw, 33vw"
          }
        />
      ) : (
        <div
          className="from-kcvv-green-dark via-kcvv-black to-kcvv-black absolute inset-0 bg-gradient-to-br"
          aria-hidden="true"
        >
          {/* Diagonal accent stripe — brand motif */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent 0, transparent 24px, var(--color-kcvv-green-bright) 24px, var(--color-kcvv-green-bright) 25px)",
            }}
          />
        </div>
      )}

      {/* Bottom gradient for text legibility */}
      <div
        className="from-kcvv-black/90 absolute inset-0 bg-gradient-to-t to-transparent"
        aria-hidden="true"
      />

      {/* Content overlay — outside <Link> so article a { color } can't bleed in */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 bottom-0 left-0",
          isFeatured ? "p-6 md:p-8" : "p-5",
        )}
      >
        {badge && (
          <span className="border-kcvv-green-bright text-kcvv-green-bright mb-2 block border-l-2 pl-2 text-xs font-bold tracking-wider uppercase">
            {badge}
          </span>
        )}

        <Heading
          className={cn(
            "font-body mb-0! line-clamp-3 leading-snug! font-bold! text-white! transition-colors group-hover:text-white/75!",
            isFeatured ? "text-2xl!" : "text-base!",
          )}
        >
          {title}
        </Heading>

        {/* Footer bar: date+time on left, countdown chip on right */}
        {(countdown ?? date ?? eventDate ?? eventTime) && (
          <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3 text-xs text-white/60">
            <div className="flex items-center gap-3">
              {eventDate && (
                <time className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" aria-hidden />
                  {eventDate}
                </time>
              )}
              {eventTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" aria-hidden />
                  {eventTime}
                </span>
              )}
              {!eventDate && !eventTime && date && <time>{date}</time>}
            </div>
            {countdown && (
              <span className="rounded-sm bg-white/10 px-2 py-0.5 text-xs font-medium tracking-wider text-white/70 uppercase">
                {countdown}
              </span>
            )}
            {isExternal && !countdown && (
              <ExternalLink
                className="h-3 w-3 flex-shrink-0 text-white/40"
                aria-hidden
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
};
