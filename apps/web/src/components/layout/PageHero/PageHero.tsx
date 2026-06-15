import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { TapedCard } from "@/components/design-system/TapedCard";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import {
  EditorialHeading,
  type EditorialHeadingEmphasis,
  type EditorialHeadingSize,
} from "@/components/design-system/EditorialHeading";
import { DottedDivider } from "@/components/design-system/Divider";
import { LinkButton } from "@/components/design-system/LinkButton";

/**
 * `<PageHero>` — the redesigned generic page-hero for non-article interior
 * surfaces (kalender, club index, club CMS pages, scheurkalender). Reclaims
 * the retired legacy `<PageHero>` name and replaces the dark-gradient
 * `<InteriorPageHero>` placeholder.
 *
 * Composes existing retro-terrace-fanzine primitives only — no new vocabulary:
 *   - Shell  → `<TapedCard bg="cream">` + one warm `<TapeStrip>` (top-left).
 *   - Kicker → jersey-deep raw label-token mono span (MonoLabel plain only
 *     renders ink/cream — see `reference_jersey_deep_kicker_pattern`).
 *   - Headline → `<EditorialHeading level={1}>` Freight upright with an
 *     optional one-word italic jersey-deep `accent`; a warm "." terminator
 *     when no accent word is present.
 *   - Lead → italic `font-display`, auto-hides when absent.
 *   - Image → `<TapedFigure aspect="landscape-16-9">` newsprint (colour) in
 *     the right column on desktop, stacked below the words on mobile.
 *     Absent (or `size="compact"`) → typographic state: the headline owns the
 *     card and a `<DottedDivider>` adds texture.
 *   - CTA → optional `<LinkButton>` slot (legacy parity).
 *
 * Design lock: `docs/design/mockups/phase-10-page-hero/10h5-locked.html` (#2120).
 */

export type PageHeroSize = "default" | "compact";

export interface PageHeroProps {
  /** Mono kicker above the headline (jersey-deep). */
  kicker: string;
  /** Headline text. Rendered upright Freight via `<EditorialHeading>`. */
  headline: string;
  /**
   * Optional one-word (or short phrase) accent rendered italic + jersey-deep.
   * Must be a substring of `headline`. When present, the warm "." terminator
   * is dropped in favour of the accent emphasis (a single EditorialHeading
   * emphasis span can carry one or the other, not both).
   */
  accent?: string;
  /** Optional italic display lead. Auto-hides when empty. */
  lead?: string;
  /** Optional landscape hero image URL. Suppressed when `size="compact"`. */
  image?: string;
  /** Alt text for the hero image. */
  imageAlt?: string;
  /** Optional CTA rendered as a primary `<LinkButton>`. */
  cta?: { label: string; href: string };
  /**
   * Optional adornment rendered beside the kicker + headline (e.g. an opponent
   * `<Crest>` on the `/tegenstander` hero). Sits left of the heading block in a
   * centred flex row; the lead and divider stay full-width below. Primarily for
   * the typographic state — pairs uneasily with an `image` and no consumer
   * combines the two.
   */
  adornment?: ReactNode;
  /**
   * `"default"` — full hero with optional image.
   * `"compact"` — tighter padding, smaller headline, image suppressed.
   *   Used by loading skeletons and bare utility pages.
   */
  size?: PageHeroSize;
  className?: string;
}

export function PageHero({
  kicker,
  headline,
  accent,
  lead,
  image,
  imageAlt = "",
  cta,
  adornment,
  size = "default",
  className,
}: PageHeroProps) {
  const isCompact = size === "compact";
  // Compact suppresses the image regardless of whether one was supplied.
  const showImage = Boolean(image) && !isCompact;
  const showLead = Boolean(lead);

  const headingSize: EditorialHeadingSize = isCompact
    ? "display-md"
    : showImage
      ? "display-lg"
      : "display-xl";

  // A single EditorialHeading emphasis span carries either the jersey-deep
  // accent word OR the warm "." terminator — not both. Accent wins when it is
  // actually present in the headline; otherwise the period gets the warm tone.
  // The warm period rides on EditorialHeading's appended terminator, matched via
  // `indexOf(".")` — so suppress it when the headline already contains a period
  // (e.g. an un-curated CMS title like "3de Prov. B"), otherwise the warm
  // styling would land on the internal period rather than the terminator.
  const accentFound = Boolean(accent && headline.includes(accent));
  const emphasis: EditorialHeadingEmphasis | undefined = accentFound
    ? { text: accent! }
    : headline.includes(".")
      ? undefined
      : { text: ".", tone: "warm" };

  const headingBlock = (
    <div>
      {/* Jersey-deep mono kicker as a raw label-token span — MonoLabel's plain
          variant only renders ink/cream tone. `tracking-[0.18em]` is the 10h5
          lock value, intentionally wider than the `--text-label--tracking`
          (0.08em) token used by inline label rows. */}
      <span
        data-testid="page-hero-kicker"
        className="text-jersey-deep font-mono text-[length:var(--text-label)] font-semibold tracking-[0.18em] uppercase"
      >
        {kicker}
      </span>

      <EditorialHeading
        level={1}
        size={headingSize}
        emphasis={emphasis}
        className="mt-2"
      >
        {headline}
      </EditorialHeading>
    </div>
  );

  const textColumn = (
    <div>
      {adornment ? (
        <div className="flex items-center gap-4">
          {adornment}
          {headingBlock}
        </div>
      ) : (
        headingBlock
      )}

      {showLead ? (
        <p
          className={cn(
            "font-display text-ink-soft mt-3.5 leading-[1.38] italic",
            showImage ? "text-[1.05rem]" : "max-w-[40ch] text-[1.25rem]",
          )}
        >
          {lead}
        </p>
      ) : null}

      {/* Typographic state only — a short dotted rule for texture (no image). */}
      {!showImage ? (
        <div className="mt-4 w-[120px]">
          <DottedDivider />
        </div>
      ) : null}

      {cta ? (
        <div className="mt-4">
          <LinkButton href={cta.href} variant="primary" withArrow>
            {cta.label}
          </LinkButton>
        </div>
      ) : null}
    </div>
  );

  return (
    <TapedCard
      as="section"
      bg="cream"
      padding={isCompact ? "md" : "lg"}
      tape={{ color: "warm", position: "left", length: "lg" }}
      dataAttrs={{
        "data-testid": "page-hero",
        "data-size": size,
        "data-state": showImage ? "image" : "typographic",
      }}
      className={className}
    >
      {showImage ? (
        // Words first in the DOM so mobile stacks text → photo (m1); desktop
        // grid places the wider words column left and the photo right.
        <div className="grid items-center gap-6 md:grid-cols-[1.3fr_1fr]">
          {textColumn}
          <TapedFigure
            aspect="landscape-16-9"
            tape={{ color: "warm", position: "right", length: "md" }}
          >
            <Image
              src={image!}
              alt={imageAlt}
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </TapedFigure>
        </div>
      ) : (
        textColumn
      )}
    </TapedCard>
  );
}
