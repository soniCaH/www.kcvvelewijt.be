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
   * Byline author (e.g. "Redactie KCVV"). Announcements render the club
   * as the implicit author when absent.
   */
  author?: string;
  /** Reading time, e.g. "4 min lezen". Shown in the byline when present. */
  readingTime?: string;
  /**
   * 16:9 cover image URL. When absent the hero renders headline + byline
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
 * above a Quasimoda 700 clamped display title in sentence case and a
 * mono small-caps byline row below.
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
  author,
  readingTime,
  coverImageUrl,
  imageAlt,
  className,
}: AnnouncementHeroProps) => {
  const kickerParts = [category, date].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  const bylineParts = [author, readingTime].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );

  return (
    <header
      className={cn(
        "w-full max-w-inner-lg mx-auto px-6 pt-10 md:pt-16",
        className,
      )}
      data-testid="announcement-hero"
    >
      <div className="max-w-[65ch]">
        {kickerParts.length > 0 && (
          <p
            className={cn(
              "mb-6 flex flex-wrap items-center gap-x-3 gap-y-1",
              "text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)] text-kcvv-green-dark",
              "before:content-[''] before:block before:w-16 before:h-[2px] before:bg-kcvv-green-bright before:mr-1 before:shrink-0",
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
          className="font-title font-bold text-kcvv-gray-blue leading-[0.95] text-[clamp(2.5rem,5.5vw,4.5rem)]"
          data-testid="announcement-hero-title"
        >
          {title}
        </h1>

        {bylineParts.length > 0 && (
          <p
            className="mt-5 font-mono text-xs uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray"
            data-testid="announcement-hero-byline"
          >
            {bylineParts.map((part, i) => (
              <span key={part}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-3 text-kcvv-gray-light"
                  >
                    ·
                  </span>
                )}
                {part}
              </span>
            ))}
          </p>
        )}
      </div>

      {coverImageUrl && (
        <div
          className="mt-10 relative w-full aspect-[16/9] overflow-hidden rounded-[4px] bg-kcvv-gray-light/30"
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
