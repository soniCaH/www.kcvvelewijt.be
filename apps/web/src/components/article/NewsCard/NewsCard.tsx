// apps/web/src/components/article/NewsCard/NewsCard.tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Calendar, Clock, ExternalLink } from "@/lib/icons";
import {
  TapedCard,
  type TapedCardBg,
  type TapeStripColor,
  type TapeStripRotation,
  MonoLabel,
  type MonoLabelTone,
  EditorialHeading,
  type EditorialHeadingTone,
} from "@/components/design-system";

export type NewsCardAspectRatio = "landscape-16-9" | "square" | "portrait-3-4";
export type NewsCardRotation = "a" | "b" | "c" | "d" | "none";
export type NewsCardVariant = "standard" | "featured";
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
   * Aspect ratio of the top image region. Defaults to 16:9 per the locked
   * NewsGrid spec — `<NewsGrid>` (#1672) and other Phase 4 consumers rely
   * on this default.
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
  /**
   * Per-slot corner tape colours `[topLeft, topRight]`. Defaults to the
   * R10 canonical pairing `["warm", "jersey"]`. `<NewsGrid>` (and any
   * future per-slot consumer) can pass a slot-derived pair so corner
   * tapes cycle across the grid instead of reading identical on every
   * card. Pass two entries; the second drops on cards that want a
   * single-tape look by setting the right strip to the same colour
   * (legacy "two-tape" rejection at #1747 was photo-strip-specific —
   * corner anchors on a paper card are the accepted R10 idiom).
   */
  tapeColors?: readonly [TapeStripColor, TapeStripColor];
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

// Default R10 corner tape pairing. Consumers (NewsGrid) override via
// the `tapeColors` prop for per-slot cycling per the R10 lock.
const DEFAULT_TAPE_COLORS: readonly [TapeStripColor, TapeStripColor] = [
  "warm",
  "jersey",
];

// Four rotation pool entries, in the order applied by `--rotate-tape-*`
// in `globals.css` (-0.5° / -0.25° / +0.25° / +0.5°).
const ROTATION_POOL: readonly TapeStripRotation[] = ["a", "b", "c", "d"];

// djb2-light string hash — deterministic, well-distributed across the
// 4-entry pool. Yields the same index for the same title across renders
// so a card's tape angle is stable (no hydration mismatch, stable VR
// baselines) without needing a grid to set `--tape-rotation`.
function hashIndex(seed: string, modulo: number): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

/**
 * Deterministic per-card tape rotation pair. The two strips on one card
 * lean in opposite directions (offset by 2 in the pool), and the pair
 * itself shifts card-to-card based on a stable seed (the title) so even
 * standalone NewsCards — outside a `<TapedCardGrid>` — read with visual
 * variety. Pure function so render/hydration produce identical output.
 */
function deriveTapeRotations(
  seed: string,
): readonly [TapeStripRotation, TapeStripRotation] {
  const left = hashIndex(seed, ROTATION_POOL.length);
  const right = (left + 2) % ROTATION_POOL.length;
  return [ROTATION_POOL[left]!, ROTATION_POOL[right]!];
}

// aspect-ratio CSS-class mapping, mirrors `<TapedFigure>`'s Tailwind
// arbitrary syntax. Inline `style.aspectRatio` was rejected at review
// for bypassing the token layer.
const ASPECT_CLASS: Record<NewsCardAspectRatio, string> = {
  "landscape-16-9": "aspect-[16/9]",
  square: "aspect-square",
  "portrait-3-4": "aspect-[3/4]",
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
  dek,
  isExternal,
  variant = "standard",
  aspectRatio = "landscape-16-9",
  rotation = "none",
  bg = "cream",
  tapeColors = DEFAULT_TAPE_COLORS,
  as = "h3",
  className,
}: NewsCardProps) => {
  const isDark = DARK_BGS.has(bg);
  const labelTone: MonoLabelTone = isDark ? "cream" : "ink";
  const headingTone: EditorialHeadingTone = isDark ? "cream" : "ink";
  const headingSize = variant === "featured" ? "display-md" : "display-sm";

  const hasFooterMeta =
    Boolean(countdown) || Boolean(date && !eventDate && !eventTime);

  // Meta panel owns its padding (outer card is `padding="none"`). The
  // featured variant gets the larger lg-equivalent inset; standard +
  // listing get the md-equivalent.
  const metaPadding = variant === "featured" ? "p-8" : "p-5";

  return (
    <TapedCard
      as="article"
      rotation={rotation}
      bg={bg}
      padding="none"
      shadow="md"
      tape={(() => {
        // Featured cards span a wider grid column, so the `md` tape
        // looked proportionally small at PR review — bump to `lg` for
        // featured, keep `md` for standard.
        const stripLength = variant === "featured" ? "lg" : "md";
        const [leftRotation, rightRotation] = deriveTapeRotations(title);
        return [
          {
            color: tapeColors[0],
            length: stripLength,
            position: "left",
            rotation: leftRotation,
          },
          {
            color: tapeColors[1],
            length: stripLength,
            position: "right",
            rotation: rightRotation,
          },
        ];
      })()}
      // Press-down hover is wired via TapedCard's `press` interactive mode
      // when the card is a link. Composes with rotation; `motion-reduce`
      // safety is implicit in the `motion-safe:hover:` Tailwind prefix.
      interactive={href ? "press" : false}
      // Intentionally NOT `overflow-hidden` on the card itself — tape
      // strips straddle the top edge via translateY(-50%) and the cover
      // <Link>'s focus-visible outline sits outside the card. Clipping
      // lives only on the image region below.
      className={cn("group relative flex h-full flex-col", className)}
    >
      {/* Top image region — flush with the outer card border on top + sides.
          aspect-ratio class drives height; `overflow-hidden` scoped here
          so `<Image fill>` cover-cropping behaves without clipping the
          card's tape strips or focus outline. The ink rule on the meta
          panel below divides image from caption. */}
      <div
        data-testid="newscard-image-region"
        data-aspect={aspectRatio}
        className={cn(
          "relative w-full overflow-hidden",
          ASPECT_CLASS[aspectRatio],
        )}
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
      </div>

      {/* Meta panel — divided from the image by a single 1px ink rule per
          R10 §"Structural changes". On dark backgrounds, switch the rule
          to a cream-30 hairline so it stays visible against ink/jersey-deep. */}
      <div
        className={cn(
          "flex flex-1 flex-col gap-4 border-t",
          isDark ? "border-cream/30" : "border-ink",
          metaPadding,
        )}
      >
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
      </div>

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
