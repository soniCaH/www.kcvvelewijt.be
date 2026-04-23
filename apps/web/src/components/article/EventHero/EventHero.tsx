import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { EventFactValue } from "@/components/article/blocks/EventFact";

export interface EventHeroProps {
  /**
   * The feature `eventFact` — first eventFact in the body. Drives the
   * kicker's second segment (ageGroup or competitionTag). When null the
   * hero collapses to `EVENT` kicker + fallback h1.
   */
  feature: EventFactValue | null;
  /**
   * Article title — rendered as the single h1 of the page. Used as the
   * h1 regardless of `feature`, since the event article's narrative
   * title is the headline (not the eventFact's `title`, which lives on
   * the strip below the metadata bar).
   */
  title: string;
  /**
   * 16:9 landscape cover image from `article.coverImage`. Same crop
   * the announcement hero uses — event articles always upload a
   * landscape image because the same asset doubles as the TV-screen
   * and Facebook-event graphic.
   */
  coverImageUrl?: string | null;
  className?: string;
}

/**
 * Design §5.4 — event hero. Kicker + article title, followed by the
 * editor-supplied 16:9 landscape cover. The serif-style date block and
 * metadata live on the `EventStrip` beneath the §7.6 metadata bar,
 * mirroring the Phase 5 transfer hero/strip split so facts appear
 * exactly once per page.
 *
 * Kicker composition: `EVENT | ${ageGroup || competitionTag}` when a
 * feature eventFact is present; bare `EVENT` otherwise.
 */
export const EventHero = ({
  feature,
  title,
  coverImageUrl,
  className,
}: EventHeroProps) => {
  const kickerMeta =
    feature?.ageGroup?.trim() || feature?.competitionTag?.trim();

  // Trim-guarded h1 — an empty heading fails every a11y audit.
  const h1 = title?.trim() || "Event";

  return (
    <header
      data-testid="event-hero"
      className={cn(
        "max-w-inner-lg mx-auto w-full px-6 pt-10 md:pt-16",
        className,
      )}
    >
      <div className="max-w-[65ch]">
        <p
          className={cn(
            "mb-6 flex flex-wrap items-center gap-x-3 gap-y-1",
            "text-kcvv-green-dark text-xs font-semibold tracking-[var(--letter-spacing-label)] uppercase",
            "before:bg-kcvv-green-bright before:mr-1 before:block before:h-[2px] before:w-16 before:shrink-0 before:content-['']",
          )}
          data-testid="event-hero-kicker"
        >
          <span>Event</span>
          {kickerMeta && (
            <>
              <span aria-hidden="true" className="text-kcvv-gray-light">
                |
              </span>
              <span>{kickerMeta}</span>
            </>
          )}
        </p>

        <h1
          className="font-title text-kcvv-gray-blue text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] font-bold"
          data-testid="event-hero-title"
        >
          {h1}
        </h1>
      </div>

      {coverImageUrl && (
        <div
          data-testid="event-hero-image"
          className="bg-kcvv-gray-light/30 relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-[4px]"
        >
          <Image
            src={coverImageUrl}
            alt={feature?.title ?? ""}
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
