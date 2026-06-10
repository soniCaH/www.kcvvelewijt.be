import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system/MonoLabel";

export type EditorialHubCardVariant = "news" | "nav";

export interface EditorialHubCardProps {
  href: string;
  /**
   * Tag pill label. An empty string renders no pill — used by Sanity nav cards
   * that carry no `editorialCards.tag`.
   */
  tag: string;
  title: string;
  arrowText: string;
  variant: EditorialHubCardVariant;
  /** News variant cover photo (greyscale → hover-colour). */
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
}

const DEFAULT_NEWS_SIZES =
  "(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw";

/**
 * <EditorialHubCard> — the uniform 16:9 image-top card of a landing-page nav
 * hub (Phase 7 / 7j3). Shared across the `/jeugd` nav hub and (later) the
 * `/club` hub; supersedes the legacy full-bleed `<EditorialCard>`.
 *
 * Two variants:
 * - **news** — a greyscale→hover-colour cover photo with a jersey-deep tag pill
 *   (the "funeral card" greyscale exception). Bubbles in the latest articles.
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
}: EditorialHubCardProps) {
  const isNav = variant === "nav";

  return (
    <Link
      href={href}
      className={cn(
        "group border-ink shadow-paper-sm bg-cream-soft flex h-full flex-col overflow-hidden border-2",
        // Canonical press-down on hover AND keyboard focus (parity with
        // <SponsorTile>): the card shifts into its shadow on both.
        "transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
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
            {tag && (
              <span className="absolute top-2.5 left-2.5 z-10">
                <MonoLabel variant="pill-cream">{tag}</MonoLabel>
              </span>
            )}
            {icon}
          </>
        ) : (
          <>
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={imageAlt ?? ""}
                fill
                sizes={sizes ?? DEFAULT_NEWS_SIZES}
                className="object-cover grayscale transition-all duration-300 ease-out group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none"
              />
            )}
            {tag && (
              <span className="relative z-10 m-2.5">
                <MonoLabel variant="pill-jersey-deep">{tag}</MonoLabel>
              </span>
            )}
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
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
