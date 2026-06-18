import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  TapedCard,
  MonoLabelRow,
  EditorialHeading,
  PageContainer,
} from "@/components/design-system";

/**
 * <MatchArticleLinkCard> — Phase 6.B.d4 "Variant B" hero-style link card.
 *
 * Surfaces the editorial article written about a match (a `matchPreview` for
 * upcoming, a `matchRecap` for finished) as a full-width `<TapedCard>` with a
 * 16:9 cover image bleeding to the top edge, a per-state kicker, the article
 * title as a display heading, a one-line lead, and a "Lees het hele verhaal →"
 * call-to-action.
 *
 * Auto-hide: returns `null` when no `article` is supplied. The page precomputes
 * the selection (`selectMatchArticle`) and only mounts the `<TrackInView>`
 * analytics wrapper when an article exists (Phase 6.A pattern), but the card
 * also guards internally so the Storybook "Hidden" story can render the
 * auto-hide branch as a blank VR baseline.
 *
 * Pure composition — no new design-system primitives (`<TapedCard>` +
 * `<MonoLabelRow>` + `<EditorialHeading>`), mirroring the homepage `<NewsCard>`
 * flush-image vocabulary per the lock.
 */

/** The minimal article shape the card renders — a `MatchArticleVM` satisfies it. */
export interface MatchArticleLinkCardArticle {
  title: string;
  /** Article slug; the card links to `/nieuws/{slug}`. */
  slug: string;
  coverImageUrl?: string | null;
  lead?: string | null;
}

/** Inline "Lees ook …" pointer to the non-dominant linked article. */
export interface MatchArticleLinkCardSecondary {
  slug: string;
  label: string;
}

export interface MatchArticleLinkCardProps {
  /** The featured article. When null/undefined, the card auto-hides (`null`). */
  article?: MatchArticleLinkCardArticle | null;
  /** Per-state kicker copy (e.g. `LEES HET VERSLAG · MATCHVERSLAG`). */
  kicker?: string;
  /** Optional inline link to the other linked article, rendered below the card. */
  secondary?: MatchArticleLinkCardSecondary | null;
  className?: string;
}

// Locked ~-0.3° tilt (6.B.d4) — a single full-width card leans slightly to
// match the page's editorial-paper-card vocabulary. `TapedCardRotation`
// accepts a raw degree number, so this is the exact spec value rather than the
// nearest `--rotate-tape-*` token.
const CARD_ROTATION = -0.3;

// Mono-caps link styling shared by the card CTA and the inline secondary link.
const MONO_LINK_CLASS =
  "font-mono text-[length:var(--text-label)] font-bold tracking-[var(--text-label--tracking)] uppercase text-jersey-deep";

export function MatchArticleLinkCard({
  article,
  kicker,
  secondary,
  className,
}: MatchArticleLinkCardProps) {
  if (!article) return null;

  const href = `/nieuws/${article.slug}`;
  const lead = article.lead?.trim() || undefined;

  return (
    <PageContainer
      as="section"
      className={cn(
        // `bg-cream` matches the sibling <MatchLineupSection> /
        // <MatchEventsSection> bands so the page reads as one continuous cream
        // column on the white body — and so the `ink-cream` <StripedSeam> above
        // it terminates against cream, not white (no visible seam break).
        "bg-cream py-10 md:py-14",
        className,
      )}
    >
      <TapedCard
        as="article"
        rotation={CARD_ROTATION}
        bg="cream"
        padding="none"
        shadow="md"
        interactive="press"
        tape={[
          { color: "warm", length: "lg", position: "left", rotation: "a" },
          { color: "jersey", length: "lg", position: "right", rotation: "c" },
        ]}
        className="group relative flex flex-col"
      >
        {/* Cover image region — 16:9, flush to the top + side edges. Clipping is
            scoped here so the tape strips + focus outline aren't clipped. */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {article.coverImageUrl ? (
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 1040px) 100vw, 1040px"
              priority={false}
            />
          ) : (
            <div
              data-testid="match-article-link-card-image-fallback"
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, transparent 0, transparent 12px, var(--color-jersey-deep) 12px, var(--color-jersey-deep) 13px)",
              }}
            />
          )}
        </div>

        {/* Body — divided from the image by a single 2px ink rule per the lock. */}
        <div className="border-ink flex flex-col gap-3 border-t-2 px-[18px] pt-4 pb-[18px] md:px-8 md:pt-6 md:pb-8">
          {kicker && (
            <MonoLabelRow items={[{ label: kicker }]} className="text-ink" />
          )}

          <EditorialHeading
            level={2}
            size="display-md"
            className="break-words hyphens-auto"
          >
            {article.title}
          </EditorialHeading>

          {lead && (
            <p className="text-body-md text-ink-soft line-clamp-2">{lead}</p>
          )}

          <div className="border-paper-edge mt-2 flex items-center border-t-2 pt-3">
            <span aria-hidden="true" className={MONO_LINK_CLASS}>
              Lees het hele verhaal →
            </span>
          </div>
        </div>

        {/* Full-card link overlay — the visible CTA above is decorative
            (aria-hidden); this carries the accessible name. */}
        <Link
          href={href}
          aria-label={article.title.trim() || "Lees het hele verhaal"}
          className="focus-visible:outline-ink absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </TapedCard>

      {secondary && (
        <Link
          href={`/nieuws/${secondary.slug}`}
          data-testid="match-article-secondary-link"
          className={cn(
            MONO_LINK_CLASS,
            "mt-4 inline-flex items-center gap-1 hover:underline",
          )}
        >
          {secondary.label} →
        </Link>
      )}
    </PageContainer>
  );
}
