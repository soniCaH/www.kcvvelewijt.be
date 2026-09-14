// apps/web/src/components/home/FeaturedEventBand/FeaturedEventBand.tsx
import Image from "next/image";
import { DateTime } from "luxon";
import { CLUB_TIMEZONE, toDisplayZone } from "@/lib/utils/dates";
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
  /** Falls back to "Kantine" per locked spec when empty — most club events are
   *  there. Required (though nullable) so a mapper cannot silently omit it and
   *  let the default overwrite a real venue, which is how #2392 happened. */
  location: string | null;
}

export interface FeaturedEventBandProps {
  event: FeaturedEventBandEvent | null;
  /** Render reference time. Defaults to now in the club's zone. Tests override
   *  to make the past/future split deterministic without freezing `Date`. */
  now?: DateTime;
  /**
   * The upstream `EventRepository.findNextFeatured()` read failed, as
   * opposed to the calendar genuinely holding no upcoming event. Read only
   * on the no-event path (mirrors `<UpcomingMatches>`'s own `unavailable`
   * prop, `UpcomingMatches.tsx:39`): with a renderable `event` present, the
   * band renders as normal regardless of this flag.
   *
   * @default false
   */
  unavailable?: boolean;
}

/**
 * The held-open dark-ground notice for a failed read. Not routed through
 * `<EmptyState tier="slot" reason="unavailable">` — that register is
 * ink-only (`border-ink/30` frame, `text-ink-soft` body, a `text-jersey-deep`
 * accent span with no prop to swap it) and is explicitly documented as wrong
 * on a dark-green band (`EmptyState.tsx`'s own file docblock, "parked: the
 * dark-ground slot register"); `jersey-deep` is this band's own background.
 * `<FirstTeamsBlock>` — the band directly above this one on the homepage
 * spine, on the same dark-green family (`jersey-deep-dark`) — solves the
 * identical problem by hand-rolling its own cream-toned frame rather than
 * waiting on that primitive to grow a dark axis (tracked separately, #2402);
 * this notice copies that same vocabulary (`border-cream/40` dashed frame,
 * `text-cream/80` body) instead of inventing a third one. See the PR for
 * #2944 for why this deviates from the ticket's literal `<EmptyState>`
 * wording.
 *
 * Keeps the kicker + a heading, matching how both sibling bands hold their
 * shape: `<FirstTeamsBlock>` keeps its "EERSTE PLOEGEN" kicker and heading
 * on a failed read, `<UpcomingMatches>` keeps "AGENDA" and "Komende
 * wedstrijden." — dropping the chrome here (review finding on #2944) left
 * the `aria-label`'d region unheaded and the band's own hierarchy missing
 * on the one render path a visitor is most likely to land on during an
 * outage. The populated heading is the event's own title and can't render
 * here, so this uses a static sentence that names the slot instead —
 * `display-md`, matching the siblings' own generic-heading size rather than
 * this band's `display-lg` hero treatment (reserved for an actual title).
 */
function FeaturedEventUnavailableNotice() {
  return (
    <section
      data-testid="featured-event-band"
      aria-label="Aanstaand evenement"
      className="bg-jersey-deep text-cream py-12 md:py-16"
    >
      <div className="mx-auto max-w-[var(--container-index)] px-4 md:px-8">
        <div className="mb-6 flex flex-col gap-2">
          <MonoLabel size="md">AANSTAAND EVENEMENT</MonoLabel>
          <EditorialHeading level={2} size="display-md" tone="cream">
            Aanstaand evenement.
          </EditorialHeading>
        </div>
        <div className="border-cream/40 border-2 border-dashed px-4 py-8 text-center">
          <p className="text-cream/80">
            Het eerstvolgende evenement is even niet beschikbaar. Probeer het
            later opnieuw.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Formats the "when" line per locked spec:
 *  - Same day, with time:    "26 apr · 19:00–21:00" or "26 apr · 19:00"
 *  - Same day, midnight only: "26 apr"
 *  - Multi-day:               "26 apr 10:00 – 28 apr 12:00" (no separator dot)
 */
function formatDateTime(dateStart: string, dateEnd?: string | null): string {
  // Belgian wall-clock and nl locale both come from the shared parse — the
  // rendered "when" line must not drift with the deploy/CI/test timezone.
  const start = toDisplayZone(dateStart);
  const end = dateEnd ? toDisplayZone(dateEnd) : null;

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
  // Zone-pinned like every other date this file reads. The comparison below is
  // between instants, so the zone cannot change the outcome — it is stated so
  // the file holds no unpinned parse for the next reader to copy.
  now = DateTime.now().setZone(CLUB_TIMEZONE),
  unavailable = false,
}: FeaturedEventBandProps) => {
  // Drop-if-empty per locked spec: null event, missing cover image, or
  // start time already past — caller doesn't have to filter upstream.
  // A failed read (`unavailable`) holds the band's shape and names the
  // reason instead of dropping silently — mirrors `<UpcomingMatches>`
  // (`UpcomingMatches.tsx:39`); #2944.
  if (!event || !event.coverImage) {
    return unavailable ? <FeaturedEventUnavailableNotice /> : null;
  }
  const start = toDisplayZone(event.dateStart);
  if (!start.isValid || start < now) {
    return unavailable ? <FeaturedEventUnavailableNotice /> : null;
  }

  const location = event.location?.trim() || "Kantine";
  const ctaUrl = event.externalLink?.url || `/evenementen/${event.slug}`;
  const ctaLabel = event.externalLink?.label || "Lees verder";
  const isExternal = Boolean(event.externalLink?.url);
  // Locked spec: warm-yellow accent on the first word of the title.
  // Skip emphasis when the title starts with whitespace or is empty so
  // splitOnEmphasis doesn't warn on dev.
  const firstWord = event.title.trim().split(/\s+/)[0] ?? "";

  return (
    <section
      data-testid="featured-event-band"
      aria-label="Aanstaand evenement"
      className="bg-jersey-deep text-cream py-12 md:py-16"
    >
      <div className="mx-auto grid max-w-[var(--container-index)] grid-cols-1 items-stretch gap-8 px-4 md:grid-cols-[1fr_1.4fr] md:gap-12 md:px-8">
        <TapedFigure
          aspect="landscape-16-9"
          rotation="a"
          tape={{ color: "warm" }}
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
