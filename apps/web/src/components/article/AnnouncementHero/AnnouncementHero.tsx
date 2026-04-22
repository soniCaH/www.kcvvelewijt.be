import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface AnnouncementHeroProps {
  /** Article title — rendered as the single h1 of the page. */
  title: string;
  /**
   * Primary category label shown in the kicker row (e.g. "Nieuws",
   * "Jeugd"). Typically the first value from `article.tags`.
   */
  category?: string;
  /**
   * Publication date formatted for display (e.g. "19 April 2026").
   */
  date?: string;
  /**
   * 16:9 cover image URL. When absent the hero renders kicker + title
   * only, matching design §5.1's "no overlay, no shadow" ethos.
   */
  coverImageUrl?: string | null;
  /**
   * Alt text for the cover image. Falls back to empty string — the hero
   * headline already carries the article's meaning, so the image is
   * treated as decorative when no alt is supplied. Thread a caption-style
   * description through as soon as the Sanity `coverImage` schema gains
   * an `alt` field (tracked separately).
   */
  imageAlt?: string;
  className?: string;
}

/**
 * Design §5.1 — the baseline announcement hero. 16:9 hotspot crop of the
 * cover image, no overlay, rounded-[4px], with a kicker (category · date)
 * above a Quasimoda 700 clamped display title in sentence case.
 *
 * The byline row shown in the original §5.1 mock-up (`By Redactie KCVV ·
 * 4 min lezen`) is intentionally omitted: the §7.6 metadata bar rendered
 * immediately below the hero already carries author + date + reading
 * time + share controls, and a second line restating author + reading
 * time was pure duplication in practice. The interview hero follows the
 * same rule. Apply this principle to the upcoming transfer + event
 * heroes too — the metadata bar is the single source of truth for these
 * three facts.
 *
 * The interview hero (`InterviewHero`) diverges on: kicker composition
 * (subject jersey + position), subtitle line, and a 4:5 portrait crop.
 * Transfer and event heroes skip the image entirely. Keeping the heroes
 * as sibling components avoids branching on `articleType` inside one
 * bloated component.
 */
export const AnnouncementHero = ({
  title,
  category,
  date,
  coverImageUrl,
  imageAlt,
  className,
}: AnnouncementHeroProps) => {
  const kickerParts = [category, date].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );

  return (
    <header
      className={cn(
        "max-w-inner-lg mx-auto w-full px-6 pt-10 md:pt-16",
        className,
      )}
      data-testid="announcement-hero"
    >
      <div className="max-w-[65ch]">
        {kickerParts.length > 0 && (
          <p
            className={cn(
              "mb-6 flex flex-wrap items-center gap-x-3 gap-y-1",
              "text-kcvv-green-dark text-xs font-semibold tracking-[var(--letter-spacing-label)] uppercase",
              "before:bg-kcvv-green-bright before:mr-1 before:block before:h-[2px] before:w-16 before:shrink-0 before:content-['']",
            )}
            data-testid="announcement-hero-kicker"
          >
            {kickerParts.map((part, i) => (
              <span key={part} className="flex items-center gap-x-3">
                {i > 0 && (
                  <span aria-hidden="true" className="text-kcvv-gray-light">
                    |
                  </span>
                )}
                <span>{part}</span>
              </span>
            ))}
          </p>
        )}

        <h1
          className="font-title text-kcvv-gray-blue text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] font-bold"
          data-testid="announcement-hero-title"
        >
          {title}
        </h1>
      </div>

      {coverImageUrl && (
        <div
          className="bg-kcvv-gray-light/30 relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-[4px]"
          data-testid="announcement-hero-image"
        >
          <Image
            src={coverImageUrl}
            alt={imageAlt ?? ""}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 960px"
            className="object-cover object-center"
          />
        </div>
      )}
    </header>
  );
};
