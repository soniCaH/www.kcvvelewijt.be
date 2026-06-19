import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { PRESS_DOWN_CLASSES } from "@/components/design-system/press-down";

export type EditorialHubCardVariant = "news" | "nav";

export interface EditorialHubCardProps {
  href: string;
  /**
   * Tag pill label. The pill always renders; an empty string renders an empty
   * pill — the 7j3 contract for Sanity nav cards that carry no
   * `editorialCards.tag`.
   */
  tag: string;
  title: string;
  arrowText: string;
  variant: EditorialHubCardVariant;
  /** News variant cover photo (newsprint colour — never greyscale). */
  imageUrl?: string;
  /** Alt text for the news cover photo. */
  imageAlt?: string;
  /**
   * Nav variant glyph — a pre-rendered icon node centered on the jersey-deep
   * panel (e.g. `<NavGlyph name="Eye" />`). Kept as a `ReactNode` so this card
   * stays a server component: Phosphor icons call `createContext` at module
   * scope and must be imported from a client boundary (`<NavGlyph>`).
   */
  icon?: ReactNode;
  /** `next/image` `sizes` hint for the news cover. */
  sizes?: string;
  /**
   * Pre-hashed article id (`hashMemberId`), news variant only. Emitted as an
   * inert `data-article-id-hashed` marker for page-scoped click-delegation
   * analytics (e.g. `<EditorialHubAnalytics>`). No raw id reaches the DOM.
   */
  articleIdHashed?: string;
}

const DEFAULT_NEWS_SIZES =
  "(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw";

/**
 * <EditorialHubCard> — the uniform 16:9 image-top card of a landing-page nav
 * hub (Phase 7 / 7j3). Shared across the `/jeugd` nav hub and (later) the
 * `/club` hub; supersedes the legacy full-bleed `<EditorialCard>`.
 *
 * Two variants:
 * - **news** — a newsprint-colour cover photo with a jersey-deep tag pill.
 *   Bubbles in the latest articles. (Greyscale→hover is reserved for sponsor
 *   logos only — never news cards/listings.)
 * - **nav** — a `bg-jersey-deep` panel with a centered Phosphor-fill glyph and a
 *   cream tag pill; no photo. Pinned navigation links.
 *
 * Both share the paper-card chrome: `border-2 border-ink`, `shadow-paper`, and
 * the canonical press-down hover. Titles `line-clamp-2` so a grid row stays
 * even regardless of article-title length.
 */
export function EditorialHubCard({
  href,
  tag,
  title,
  arrowText,
  variant,
  imageUrl,
  imageAlt,
  icon,
  sizes,
  articleIdHashed,
}: EditorialHubCardProps) {
  const isNav = variant === "nav";

  return (
    <Link
      href={href}
      // Inert analytics markers — read by a page-scoped click-delegation
      // wrapper (<EditorialHubAnalytics>); no per-card onClick.
      data-card-type={variant}
      data-tag={tag}
      data-article-id-hashed={articleIdHashed}
      className={cn(
        "group border-ink shadow-paper-sm bg-cream-soft flex h-full flex-col overflow-hidden border-2",
        // Canonical press-down on hover AND keyboard focus (parity with
        // <SponsorTile>): the card shifts into its shadow on both. The hover
        // translate is motion-safe-gated via PRESS_DOWN_CLASSES; the
        // focus-visible press always moves so keyboard focus stays locatable.
        PRESS_DOWN_CLASSES,
        "focus-visible:outline-jersey-deep focus-visible:translate-x-1 focus-visible:translate-y-1 focus-visible:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2",
      )}
    >
      <div
        className={cn(
          "border-ink relative flex aspect-[16/9] border-b-2",
          isNav
            ? "bg-jersey-deep items-center justify-center"
            : "bg-cream-deep items-start",
        )}
      >
        {isNav ? (
          <>
            {/* Pill always renders; an empty `tag` is an empty pill (7j3). */}
            <span className="absolute top-2.5 left-2.5 z-10">
              <MonoLabel variant="pill-cream">{tag}</MonoLabel>
            </span>
            {icon}
          </>
        ) : (
          <>
            {imageUrl && (
              // Newsprint COLOUR — news covers are never greyscale (that
              // treatment is reserved for sponsor logos).
              <Image
                src={imageUrl}
                alt={imageAlt ?? ""}
                fill
                sizes={sizes ?? DEFAULT_NEWS_SIZES}
                className="object-cover"
                style={{ filter: "var(--filter-photo-newsprint)" }}
              />
            )}
            <span className="relative z-10 m-2.5">
              <MonoLabel variant="pill-jersey-deep">{tag}</MonoLabel>
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3.5">
        <span className="text-ink font-display line-clamp-2 text-lg leading-tight font-extrabold italic">
          {title}
        </span>
        <span className="text-jersey-deep inline-flex items-center gap-1 font-mono text-[length:var(--text-label)] leading-none font-medium tracking-[var(--text-label--tracking)] uppercase">
          {arrowText}
          <span
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
