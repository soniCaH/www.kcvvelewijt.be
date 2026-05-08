// apps/web/src/components/home/FeaturedEventBand/FeaturedEventBand.tsx
import Image from "next/image";
import { DateTime } from "luxon";
import {
  EditorialHeading,
  LinkButton,
  MonoLabel,
  TapedFigure,
} from "@/components/design-system";

export interface FeaturedEventBandImage {
  url: string;
  alt: string;
}

export interface FeaturedEventBandLink {
  url: string;
  label?: string | null;
}

/**
 * Component-prop shape — intentionally decoupled from `EventVM` /
 * `EventDetailVM` so the homepage integration (#1680) can map whatever
 * `EventRepository.findNextFeatured()` returns into this shape without
 * leaking GROQ projection details.
 */
export interface FeaturedEventBandEvent {
  /** Plain event title. Optional accent is supplied via `accentFirstWord`. */
  title: string;
  slug: string;
  /** ISO datetime string. */
  dateStart: string;
  /** ISO datetime string. Optional. When set and on a different day from
   *  `dateStart`, the "when" line renders a multi-day range. */
  dateEnd?: string | null;
  coverImage: FeaturedEventBandImage | null;
  externalLink?: FeaturedEventBandLink | null;
  /** Falls back to "Kantine" per locked spec — schema field arrives in
   *  the Phase 6 events redesign. */
  location?: string | null;
}

export interface FeaturedEventBandProps {
  event: FeaturedEventBandEvent | null;
  /** Render reference time. Defaults to `DateTime.now()`. Tests override
   *  to make the past/future split deterministic without freezing `Date`. */
  now?: DateTime;
}

const LOCALE = "nl";
// KCVV is in Belgium — pin formatting to Europe/Brussels so DST and TZ
// drift in deploy / CI / test environments doesn't change the rendered
// "when" line. Sanity stores event datetimes in UTC; readers are in BE.
const TZ = "Europe/Brussels";

/**
 * Formats the "when" line per locked spec:
 *  - Same day, with time:    "26 apr · 19:00–21:00" or "26 apr · 19:00"
 *  - Same day, midnight only: "26 apr"
 *  - Multi-day:               "26 apr 10:00 – 28 apr 12:00" (no separator dot)
 */
function formatDateTime(dateStart: string, dateEnd?: string | null): string {
  const start = DateTime.fromISO(dateStart).setZone(TZ).setLocale(LOCALE);
  const end = dateEnd
    ? DateTime.fromISO(dateEnd).setZone(TZ).setLocale(LOCALE)
    : null;

  const sameDay =
    !end || end.startOf("day").valueOf() === start.startOf("day").valueOf();

  if (!sameDay && end) {
    return `${start.toFormat("d MMM HH:mm")} – ${end.toFormat("d MMM HH:mm")}`;
  }

  const startTime = start.toFormat("HH:mm");
  const showStartTime = startTime !== "00:00";
  const endTime = end ? end.toFormat("HH:mm") : null;

  if (showStartTime && endTime && endTime !== startTime) {
    return `${start.toFormat("d MMM")} · ${startTime}–${endTime}`;
  }
  if (showStartTime) {
    return `${start.toFormat("d MMM")} · ${startTime}`;
  }
  return start.toFormat("d MMM");
}

export const FeaturedEventBand = ({
  event,
  now = DateTime.now(),
}: FeaturedEventBandProps) => {
  // Drop-if-empty per locked spec: null event, missing cover image, or
  // start time already past — caller doesn't have to filter upstream.
  if (!event || !event.coverImage) return null;
  const start = DateTime.fromISO(event.dateStart);
  if (!start.isValid || start < now) return null;

  const location = event.location?.trim() || "Kantine";
  const ctaUrl = event.externalLink?.url || `/evenementen/${event.slug}`;
  const ctaLabel = event.externalLink?.label || "Meer info";
  const isExternal = Boolean(event.externalLink?.url);
  // Locked spec: warm-yellow accent on the first word of the title.
  // Skip emphasis when the title starts with whitespace or is empty so
  // splitOnEmphasis doesn't warn on dev.
  const firstWord = event.title.trim().split(/\s+/)[0] ?? "";

  return (
    <section
      data-testid="featured-event-band"
      className="bg-jersey-deep text-cream py-12 md:py-16"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-8 px-4 md:grid-cols-[1fr_1.4fr] md:gap-12 md:px-8">
        <TapedFigure
          aspect="landscape-16-9"
          rotation="a"
          tape={[{ color: "warm" }]}
          bg="cream"
        >
          <Image
            src={event.coverImage.url}
            alt={event.coverImage.alt}
            fill
            className="object-cover"
            sizes="(max-width: 880px) 100vw, 40vw"
          />
        </TapedFigure>

        <div className="flex flex-col justify-between gap-4">
          {/* Default ink tone — 6.9:1 on jersey-deep, AA pass. Cream tone
             is reserved for the "when · location" line below where the
             original inline span already failed AA. */}
          <MonoLabel size="md">AANSTAAND EVENEMENT</MonoLabel>

          <EditorialHeading
            level={2}
            size="display-lg"
            tone="cream"
            {...(firstWord
              ? { emphasis: { text: firstWord, tone: "warm" as const } }
              : {})}
          >
            {event.title}
          </EditorialHeading>

          <MonoLabel size="md" tone="cream">
            {formatDateTime(event.dateStart, event.dateEnd)} · {location}
          </MonoLabel>

          <div className="mt-2">
            <LinkButton
              href={ctaUrl}
              variant="primary"
              withArrow
              {...(isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {ctaLabel}
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
};
