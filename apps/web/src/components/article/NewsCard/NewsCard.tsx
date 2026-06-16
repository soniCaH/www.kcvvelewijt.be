// apps/web/src/components/article/NewsCard/NewsCard.tsx
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  TapedCard,
  type TapedCardBg,
  type TapeStripColor,
  type TapeStripLength,
  type TapeStripProps,
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
  /**
   * Article-type kicker shown ahead of the badge in the MonoLabel row, as a
   * jersey-deep dot + label (5.d-mat-refine Card B). Used to flag match
   * preview/recap cards on the news index; omit on other types.
   */
  typeLabel?: string;
  /** Display date for articles (shown in MonoLabel row). */
  date?: string;
  /**
   * Optional lead/dek paragraph (article `lead` field). Falls back to nothing
   * when absent — cards with no lead still read correctly.
   */
  dek?: string;
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
  /**
   * Number of corner tape strips. `1` (default) = TL only — the
   * single-tape look adopted site-wide (#2027) after the R10 TL + TR
   * corner pair read as cluttered across full card grids. `2` opts
   * back into the TL + TR corner pair for surfaces that want it.
   */
  tapeCount?: 1 | 2;
  /**
   * Tape length override. Defaults to the variant-derived size
   * (`featured` → `"lg"`, `standard` → `"md"`). Surfaces that keep
   * the featured-heading size but live in medium real estate (e.g.
   * Uitgelicht) opt out of the default with `"md"`.
   */
  tapeLength?: TapeStripLength;
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
  typeLabel,
  date,
  dek,
  variant = "standard",
  aspectRatio = "landscape-16-9",
  rotation = "none",
  bg = "cream",
  tapeColors = DEFAULT_TAPE_COLORS,
  tapeCount = 1,
  tapeLength,
  as = "h3",
  className,
}: NewsCardProps) => {
  const isDark = DARK_BGS.has(bg);
  const labelTone: MonoLabelTone = isDark ? "cream" : "ink";
  const headingTone: EditorialHeadingTone = isDark ? "cream" : "ink";
  const headingSize = variant === "featured" ? "display-md" : "display-sm";

  const hasFooterMeta = Boolean(date);

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
        // looked proportionally small in #1748 — default to `lg` for
        // featured, `md` for standard. `tapeLength` overrides per
        // consumer (Uitgelicht passes `"md"` even on featured cards).
        const stripLength: TapeStripLength =
          tapeLength ?? (variant === "featured" ? "lg" : "md");
        const [leftRotation, rightRotation] = deriveTapeRotations(title);
        const strips: TapeStripProps[] = [
          {
            color: tapeColors[0],
            length: stripLength,
            position: "left",
            rotation: leftRotation,
          },
        ];
        if (tapeCount === 2) {
          strips.push({
            color: tapeColors[1],
            length: stripLength,
            position: "right",
            rotation: rightRotation,
          });
        }
        return strips;
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
        {/* MonoLabel row — type kicker + badge. Truthy check (not `??`)
            guards against empty-string CMS values. */}
        {(typeLabel || badge) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {typeLabel && (
              <span
                data-testid="newscard-type-label"
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono text-[length:var(--text-label)] font-bold tracking-[var(--text-label--tracking)] uppercase",
                  isDark ? "text-cream" : "text-jersey-deep",
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current"
                />
                {typeLabel}
              </span>
            )}
            {badge && <MonoLabel tone={labelTone}>{badge}</MonoLabel>}
          </div>
        )}

        <EditorialHeading
          level={HEADING_LEVEL[as]}
          size={headingSize}
          tone={headingTone}
          // `break-words` + `hyphens-auto` — long Dutch compounds
          // (e.g. "Voorbeschouwing", "competitiestart") overflowed the
          // card horizontally before `line-clamp-3` could vertically
          // truncate, producing a mid-word visual clip.
          className="line-clamp-3 break-words hyphens-auto"
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

        {/* `||` not `??` — an empty-string href (possible from a stale
            CMS field) must defer to hasFooterMeta rather than render
            the footer with an unusable empty link. */}
        {(href || hasFooterMeta) && (
          <div
            className={cn(
              "mt-auto flex items-center justify-between gap-3 border-t-2 pt-3",
              isDark ? "border-cream/30" : "border-paper-edge",
            )}
          >
            <div className="flex items-center gap-3 text-xs">
              {date && (
                <MonoLabel tone={labelTone}>
                  <time>{date}</time>
                </MonoLabel>
              )}
            </div>
            {href && (
              <span
                aria-hidden="true"
                data-testid="newscard-readmore"
                className={cn(
                  "inline-flex items-center gap-1 font-mono text-[length:var(--text-label)] font-medium tracking-[var(--text-label--tracking)] uppercase",
                  // Hidden at rest, revealed on hover / keyboard focus —
                  // mirrors the homepage hero's "Lees verder" reveal idiom
                  // (#2027). Opacity-only so the footer row reserves its
                  // height and nothing reflows. The canonical press-down
                  // hover stays intact via TapedCard's `interactive="press"`.
                  // `group-focus-within` (not `-focus-visible`): the `group`
                  // is the non-focusable <article> wrapper and the focusable
                  // <Link> is a descendant, so we react to focus *within* the
                  // card. (EditorialHero can use `-focus-visible` because there
                  // the `group` sits on the <Link> itself.)
                  "opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100",
                  isDark ? "text-cream" : "text-jersey-deep",
                )}
              >
                Lees verder →
              </span>
            )}
          </div>
        )}
      </div>

      {href && (
        <Link
          href={href}
          aria-label={title.trim() || "Nieuwsbericht"}
          data-variant={variant}
          data-rotation={rotation}
          data-aspect={aspectRatio}
          data-bg={bg}
          className={cn(
            "absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
            // Outline tone follows surface — ink outline disappears on bg=ink.
            isDark ? "focus-visible:outline-warm" : "focus-visible:outline-ink",
          )}
        />
      )}
    </TapedCard>
  );
};
