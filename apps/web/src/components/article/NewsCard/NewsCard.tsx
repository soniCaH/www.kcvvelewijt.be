// apps/web/src/components/article/NewsCard/NewsCard.tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Calendar, Clock, ExternalLink } from "@/lib/icons";
import {
  TapedCard,
  type TapedCardBg,
  TapedFigure,
  MonoLabel,
  type MonoLabelTone,
  EditorialHeading,
  type EditorialHeadingTone,
} from "@/components/design-system";

export type NewsCardAspectRatio = "landscape-16-9" | "square" | "portrait-3-4";
export type NewsCardRotation = "a" | "b" | "c" | "d" | "none";
export type NewsCardVariant = "standard" | "featured" | "listing";
export type NewsCardBg = TapedCardBg;

export interface NewsCardProps {
  title: string;
  /** Optional — cards without href are non-interactive. */
  href?: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Single category label — shown in the MonoLabel row above the title. */
  badge?: string;
  /** Display date for articles (shown in MonoLabel row when no event meta). */
  date?: string;
  /** ISO datetime or formatted string for event date (shown with Calendar icon). */
  eventDate?: string;
  /** HH:MM time string for events (shown with Clock icon). */
  eventTime?: string;
  /** Countdown label shown in the footer chip (e.g. "over 33 dagen"). */
  countdown?: string;
  /**
   * Optional lead/dek paragraph (article `lead` field). Falls back to nothing
   * when absent — cards with no lead still read correctly.
   */
  dek?: string;
  /** When true, full-card link opens in a new tab with an ExternalLink indicator. */
  isExternal?: boolean;
  variant?: NewsCardVariant;
  /**
   * Aspect ratio of the inner polaroid figure. Defaults to 16:9 per the
   * locked NewsGrid spec — `<NewsGrid>` (#1672) and other Phase 4 consumers
   * rely on this default. Pre-redesign callers (`/nieuws` archive,
   * `<RelatedContentSection>`) pick up 16:9 too; their full retro-terrace
   * rebuild is Phase 5+ scope.
   */
  aspectRatio?: NewsCardAspectRatio;
  /**
   * Phase 4 / NewsGrid — applies a small slot-deterministic rotation using
   * the shared `--rotate-tape-{a,b,c,d}` tokens. Default `"none"` preserves
   * un-rotated rendering.
   */
  rotation?: NewsCardRotation;
  /**
   * Paper surface for the outer `<TapedCard>`. Default `"cream"`. `<NewsGrid>`
   * slots `bg` per position for paper-stamp variety across the 1+4 cluster.
   */
  bg?: NewsCardBg;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}

const HEADING_LEVEL: Record<
  NonNullable<NewsCardProps["as"]>,
  1 | 2 | 3 | 4 | 5 | 6
> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

// Dark backgrounds need cream-toned typography; cream/jersey accept ink.
const DARK_BGS: ReadonlySet<TapedCardBg> = new Set(["ink", "jersey-deep"]);

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
  dek,
  isExternal,
  variant = "standard",
  aspectRatio = "landscape-16-9",
  rotation = "none",
  bg = "cream",
  as = "h3",
  className,
}: NewsCardProps) => {
  const isDark = DARK_BGS.has(bg);
  const labelTone: MonoLabelTone = isDark ? "cream" : "ink";
  const headingTone: EditorialHeadingTone = isDark ? "cream" : "ink";
  const headingSize = variant === "featured" ? "display-md" : "display-sm";
  const figureTape = { color: "warm", length: "md" } as const;

  const hasFooterMeta =
    Boolean(countdown) || Boolean(date && !eventDate && !eventTime);

  return (
    <TapedCard
      as="article"
      rotation={rotation}
      bg={bg}
      padding={variant === "featured" ? "lg" : "md"}
      shadow="md"
      className={cn(
        "group relative flex h-full flex-col gap-4",
        // Canonical paper press-down hover — matches the press-down convention
        // used across paper-stamped interactive primitives.
        href &&
          "transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {/* Inner polaroid figure — always TapedFigure for tape + border parity. */}
      <TapedFigure
        aspect={aspectRatio}
        bg="cream-soft"
        tape={figureTape}
        className="relative"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover"
            sizes={
              variant === "featured"
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 768px) 100vw, 33vw"
            }
          />
        ) : (
          <div
            data-testid="newscard-image-fallback"
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent 0, transparent 12px, var(--color-jersey-deep) 12px, var(--color-jersey-deep) 13px)",
            }}
          />
        )}
      </TapedFigure>

      {/* MonoLabel row — badge + optional event meta. Truthy check (not `??`)
          guards against empty-string CMS values. */}
      {(badge || eventDate || eventTime) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {badge && <MonoLabel tone={labelTone}>{badge}</MonoLabel>}
          {eventDate && (
            <MonoLabel tone={labelTone}>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" aria-hidden />
                <time>{eventDate}</time>
              </span>
            </MonoLabel>
          )}
          {eventTime && (
            <MonoLabel tone={labelTone}>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" aria-hidden />
                {eventTime}
              </span>
            </MonoLabel>
          )}
        </div>
      )}

      <EditorialHeading
        level={HEADING_LEVEL[as]}
        size={headingSize}
        tone={headingTone}
        className="line-clamp-3"
      >
        {title}
      </EditorialHeading>

      {dek && (
        <p
          className={cn(
            "text-body-md line-clamp-3",
            // Full-opacity cream on dark surfaces — opacity-reduced cream
            // (e.g. `text-cream/85`) trips axe contrast on bg-jersey-deep.
            isDark ? "text-cream" : "text-ink-soft",
          )}
        >
          {dek}
        </p>
      )}

      {(href ?? hasFooterMeta) && (
        <div
          className={cn(
            "mt-auto flex items-center justify-between gap-3 border-t-2 pt-3",
            isDark ? "border-cream/30" : "border-paper-edge",
          )}
        >
          <div className="flex items-center gap-3 text-xs">
            {date && !eventDate && !eventTime && (
              <MonoLabel tone={labelTone}>
                <time>{date}</time>
              </MonoLabel>
            )}
            {countdown && <MonoLabel tone={labelTone}>{countdown}</MonoLabel>}
          </div>
          {href && (
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex items-center gap-1 font-mono text-[length:var(--text-label)] font-medium tracking-[var(--text-label--tracking)] uppercase",
                isDark ? "text-cream" : "text-jersey-deep",
              )}
            >
              {isExternal ? (
                <>
                  Bekijk
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </>
              ) : (
                <>Lees verder →</>
              )}
            </span>
          )}
        </div>
      )}

      {href && (
        <Link
          href={href}
          aria-label={
            isExternal
              ? `${title.trim() || "Nieuwsbericht"} (opent in nieuw venster)`
              : title.trim() || "Nieuwsbericht"
          }
          data-variant={variant}
          data-rotation={rotation}
          data-aspect={aspectRatio}
          data-bg={bg}
          className={cn(
            "absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
            // Outline tone follows surface — ink outline disappears on bg=ink.
            isDark ? "focus-visible:outline-warm" : "focus-visible:outline-ink",
          )}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        />
      )}
    </TapedCard>
  );
};
