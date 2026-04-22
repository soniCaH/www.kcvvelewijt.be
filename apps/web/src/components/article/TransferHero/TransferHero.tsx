import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  resolveTransfer,
  type TransferFactValue,
} from "@/components/article/blocks/TransferFact";

export interface TransferHeroProps {
  /**
   * The feature `transferFact` — first transferFact in the body. Drives
   * the kicker direction label, h1 (player name), meta line, and the
   * optional pull-quote. When null the hero renders a headline-only
   * composition using `fallbackTitle` (legacy article without a
   * structured transfer block).
   */
  feature: TransferFactValue | null;
  /**
   * Hotspot-aware 4:5 portrait crop of `article.coverImage`. Same
   * projection the interview hero uses (see `coverImagePortraitUrl` on
   * the GROQ query). The pattern/texture is baked into the editor-
   * supplied image — no frontend compositing.
   */
  coverImageUrl?: string | null;
  /**
   * Used when `feature` is null — article title becomes the headline so
   * the page still has an h1. Ignored when `feature` is provided.
   */
  fallbackTitle?: string;
  className?: string;
}

/**
 * Design §5.3 — transfer intro. Two-column layout: typographic details
 * on the left (kicker, h1, age/position meta, optional pull-quote) and
 * the 4:5 cover portrait on the right. No cream band — the hero stays
 * white like the announcement template; visual weight comes from the
 * display-scale h1 and the portrait crop.
 *
 * The horizontal van → naar strip is a **separate** component
 * (`TransferStrip`) rendered below the §7.6 metadata bar so it has
 * room to breathe, and so editors' context subtitles (league/level)
 * can sit under each club without crowding the hero.
 */
export const TransferHero = ({
  feature,
  coverImageUrl,
  fallbackTitle,
  className,
}: TransferHeroProps) => {
  const resolved = feature ? resolveTransfer(feature) : null;

  // Trim-guarded h1 — an empty heading fails every a11y audit and would
  // silently ship if all three signals were missing.
  const h1 = feature?.playerName?.trim() || fallbackTitle?.trim() || "Transfer";

  const metaParts = feature
    ? [
        typeof feature.age === "number" ? `${feature.age} jaar` : null,
        feature.position,
      ].filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];

  const attribution = feature?.noteAttribution?.trim()
    ? feature.noteAttribution.trim()
    : feature?.playerName?.trim();

  return (
    <header
      data-testid="transfer-hero"
      className={cn(
        "w-full max-w-inner-lg mx-auto px-6 pt-10 md:pt-16",
        className,
      )}
    >
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
        {/* Left column — kicker + h1 + meta + optional pull-quote */}
        <div className="max-w-[60ch]">
          <p
            className={cn(
              "mb-6 flex flex-wrap items-center gap-x-3 gap-y-1",
              "text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)] text-kcvv-green-dark",
              "before:content-[''] before:block before:w-16 before:h-[2px] before:bg-kcvv-green-bright before:mr-1 before:shrink-0",
            )}
            data-testid="transfer-hero-kicker"
          >
            <span>Transfer</span>
            {resolved && (
              <>
                <span aria-hidden="true" className="text-kcvv-gray-light">
                  |
                </span>
                <span>{resolved.kickerLabel}</span>
              </>
            )}
          </p>

          <h1
            className="font-title font-bold text-kcvv-gray-blue leading-[0.95] text-[clamp(2.5rem,5.5vw,4.5rem)]"
            data-testid="transfer-hero-title"
          >
            {h1}
          </h1>

          {metaParts.length > 0 && (
            <p
              data-testid="transfer-hero-meta"
              className="mt-4 flex flex-wrap items-center gap-x-3 text-base text-kcvv-gray-dark"
            >
              {metaParts.map((part, i) => (
                <span key={part}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="mr-3 text-kcvv-gray-light"
                    >
                      ·
                    </span>
                  )}
                  {part}
                </span>
              ))}
            </p>
          )}

          {feature?.note && (
            <figure
              data-testid="transfer-hero-note"
              className="mt-8 border-l-2 border-kcvv-green-bright pl-5"
            >
              <blockquote className="font-title italic text-xl leading-[1.45] text-kcvv-gray-blue">
                &ldquo;{feature.note}&rdquo;
              </blockquote>
              {attribution && (
                <figcaption
                  data-testid="transfer-hero-note-attribution"
                  className={cn(
                    "mt-3 font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray",
                    "before:content-['—'] before:text-kcvv-green-bright before:mr-2",
                  )}
                >
                  {attribution}
                </figcaption>
              )}
            </figure>
          )}
        </div>

        {/* Right column — 4:5 hotspot portrait from article.coverImage */}
        {coverImageUrl ? (
          <div
            data-testid="transfer-hero-image"
            className="relative w-full max-w-[32rem] mx-auto aspect-[4/5] overflow-hidden rounded-[4px] bg-kcvv-gray-light/30"
          >
            <Image
              src={coverImageUrl}
              alt={
                feature?.playerName ? `Portret van ${feature.playerName}` : ""
              }
              fill
              priority
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover object-center"
            />
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
      </div>
    </header>
  );
};
