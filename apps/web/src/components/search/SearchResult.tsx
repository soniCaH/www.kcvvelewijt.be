/**
 * SearchResult Component
 *
 * 8s2-redux "postmark stamp" row (owner pick #2106): a cream paper card with a
 * rotated rubber-stamp type badge pressed into the top-right corner, a
 * newsprint-toned `64×64` square thumbnail (photo, or a jersey-deep initial disc
 * for teams / missing photos), a serif (Freight) title, a muted snippet, and
 * article tags as mono chips. Canonical paper press-down on hover.
 */

import Link from "next/link";
import Image from "next/image";
import { SearchResult as SearchResultType } from "./SearchInterface";
import { MonoLabel, StampBadge } from "@/components/design-system";

export interface SearchResultProps {
  /**
   * Search result data
   */
  result: SearchResultType;
  /**
   * Click handler for analytics tracking
   */
  onClick?: () => void;
  // Note: query prop removed until highlighting feature is implemented (YAGNI)
}

const typeLabels = {
  article: "Nieuws",
  player: "Speler",
  staff: "Staf",
  team: "Team",
} as const;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    // Pin to the club's zone so a date renders identically on the UTC
    // SSR/build host and a Belgian client (no off-by-one / hydration drift).
    timeZone: "Europe/Brussels",
  });

/**
 * Individual search result row — postmark-stamp paper card (8s2-redux).
 */
export const SearchResult = ({ result, onClick }: SearchResultProps) => {
  const isArticle = result.type === "article";
  const tags = isArticle ? result.tags : undefined;
  const initial = result.title.trim().charAt(0).toUpperCase();

  return (
    <Link
      href={result.url}
      onClick={onClick}
      className="group border-ink bg-cream-soft text-ink shadow-paper-sm relative flex gap-3.5 border-2 p-4 transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
    >
      {/* Rubber-stamp type badge, pressed into the top-right corner. */}
      <StampBadge tone="jersey" position="top-right" rotation={-5}>
        {typeLabels[result.type]}
      </StampBadge>

      {/* Uniform 64×64 square thumbnail — newsprint-toned photo when available,
          else the jersey-deep initial disc (team crest / missing-photo
          fallback). */}
      <div className="border-ink bg-cream relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden border-[1.5px]">
        {result.imageUrl ? (
          <Image
            src={result.imageUrl}
            alt={result.title}
            fill
            className="object-cover"
            sizes="64px"
            // Newsprint colour treatment — matches squad/news/people photos
            // across the site (photo-treatment-system-locked).
            style={{ filter: "var(--filter-photo-newsprint)" }}
          />
        ) : (
          <span
            data-testid="search-result-thumb-fallback"
            aria-hidden="true"
            className="bg-jersey-deep text-cream font-display flex h-full w-full items-center justify-center text-[26px] leading-none font-black italic"
          >
            {initial}
          </span>
        )}
      </div>

      {/* Content — `pr-2` keeps the title clear of the corner stamp. */}
      <div className="min-w-0 flex-1 pr-2">
        {/* Date (articles only) */}
        {isArticle && result.date && (
          <span className="text-ink-muted font-mono text-[11px] tracking-[0.04em] uppercase">
            {formatDate(result.date)}
          </span>
        )}

        {/* Title — Freight Display (the site's editorial card-title voice).
            Rendered raw (not via <EditorialHeading>) so mixed-type result
            titles — player/staff names especially — don't get a trailing
            period appended. */}
        <h3 className="font-display mt-1 line-clamp-2 text-[17px] leading-snug font-bold">
          {result.title}
        </h3>

        {/* Snippet */}
        {result.description && (
          <p className="text-ink-soft mt-1 line-clamp-2 text-sm leading-snug">
            {result.description}
          </p>
        )}

        {/* Tags (articles only) */}
        {tags && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, index) => (
              <MonoLabel key={`${tag}-${index}`} variant="pill-cream" size="sm">
                {tag}
              </MonoLabel>
            ))}
            {tags.length > 3 && (
              <span className="text-ink-muted self-center font-mono text-[10px] tracking-[0.06em] uppercase">
                +{tags.length - 3} meer
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
