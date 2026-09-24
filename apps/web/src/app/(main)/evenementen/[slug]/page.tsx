/**
 * Event detail page (`/evenementen/[slug]`).
 *
 * The editorial, cream counterpoint to the dark ticket-wall list (design lock
 * 6e5 — variant D "Editoriaal"): a centred `<EventHero>` with the Reserveer /
 * "Zet in agenda" CTAs, followed by `<RelatedRow>` (#2443/#2581) — galleries
 * linked to this event (domain tier) above other upcoming events (siblings
 * tier), replacing the former standalone `<AndereEvents>` list +
 * `<GallerySection>` pair. `event_view` fires client-side via
 * `<EventViewTracker>`; the CTAs fire `event_detail_cta_click`.
 * `/events/[slug]` 301s here (see `next.config.ts`).
 */

import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Effect } from "effect";

import { runPromise } from "@/lib/effect/runtime";
import {
  EventRepository,
  type EventDetailVM,
} from "@/lib/repositories/event.repository";
import {
  PhotoGalleryRepository,
  type GalleryCardVM,
} from "@/lib/repositories/photoGallery.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildEventJsonLd } from "@/lib/seo/jsonld";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { PageContainer, UpLink } from "@/components/design-system";
import { EventHero } from "@/components/event/EventHero";
import { EventViewTracker } from "@/components/event/EventViewTracker";
import { RelatedRow } from "@/components/related/RelatedRow";
import { mergeRelatedRow } from "@/components/related/mergeRelatedRow";
import {
  mapGalleriesToRelatedRow,
  eventVMsToSiblingItems,
} from "@/lib/utils/article-related-items";

import { EventDetailCtas } from "./EventDetailCtas";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

// Deliberately empty (#3135, flake class H): an enumerated slug is rendered at
// build, so its own subject read runs against live Sanity and one 503 there
// killed the whole build. Each slug renders on its first request instead and
// ISR caches it; a failed first request is a 500 that is never cached.
// Required all the same: without this export `revalidate` is inert (#2391).
export async function generateStaticParams() {
  return [];
}

// Subject read: the event is this page's entire content, so a failed read
// takes it down with it via `Effect.orDie` (#2864). Wrapped in React
// `cache()` so the same-segment `layout.tsx` (existence check, #2968),
// `generateMetadata` below, and the page component (its own first read; see
// `EventDetailPage`) share one `findBySlug` per request instead of three
// (#2441). The page's `upcoming`/`galleries` reads are a second, necessary
// call — they depend on the event's id and only run once existence is
// confirmed.
export const fetchEventOrNull = cache(async function fetchEventOrNull(
  slug: string,
) {
  return runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      return yield* repo.findBySlug(slug);
    }).pipe(Effect.orDie),
  );
});

/**
 * The one not-found condition for this route — kept in one place, next to
 * the cached fetch, because it is compound (#2968 review): a missing
 * document, or one whose `dateStart` was cleared in Studio. GROQ projects
 * `dateStart` via `coalesce(dateStart, "")`, so a cleared field arrives as
 * `""`, not `null` — left unchecked, it would render `Invalid DateTime`
 * instead of a clean 404. Both `layout.tsx` and this page call this one
 * function so a future tightening of the condition can't drift between the
 * two the way two independent `!event || !event.dateStart` copies could.
 */
export function isEventNotFound(event: EventDetailVM | null): event is null {
  return !event || !event.dateStart;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  // Subject read: this route's metadata is entirely about this one event, so
  // a failed read takes it down with it — `null` (genuinely no such event)
  // is the only case that degrades to the "niet gevonden" fallback (#2864).
  const event = await fetchEventOrNull(slug);
  if (!event)
    return {
      title: "Evenement niet gevonden",
      // #2963/#2968: belt-and-braces. The same-segment `layout.tsx` now
      // gets a real 404 here, but this noindex stays in case a future
      // `loading.tsx`/ancestor boundary ever reintroduces the soft 200.
      robots: { index: false, follow: false },
    };

  const description = `${event.title} — Evenement van KCVV Elewijt`;

  return {
    title: event.title,
    description,
    alternates: { canonical: `${SITE_CONFIG.siteUrl}/evenementen/${slug}` },
    openGraph: {
      title: event.title,
      description,
      type: "website",
      images: event.coverImageUrl
        ? [
            {
              url: event.coverImageUrl,
              alt: event.coverImageAlt || event.title,
            },
          ]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  // The event is the page's subject — a failed `findBySlug` takes the page
  // down with it via `Effect.orDie` in `fetchEventOrNull`. The same-segment
  // `layout.tsx` already ran this exact check before the shell flushed
  // (#2968); `cache()` means this call reuses that read rather than firing a
  // second one.
  const event = await fetchEventOrNull(slug);

  // Same-segment `layout.tsx` already ran `isEventNotFound` before the
  // shell flushed (#2968); repeated here (not only there) so this early
  // return still short-circuits the reads below and narrows `event` for the
  // compiler, not because the two might disagree — they call the same
  // function.
  if (isEventNotFound(event)) notFound();

  // `upcoming`/`galleries` depend on the now-confirmed event id, so they run
  // as their own read rather than folding into `fetchEventOrNull` above.
  // `galleries` is a section and degrades independently with its own
  // `catchAllCause` (#2864); `upcoming` shares the event's subject-read fate
  // via `Effect.orDie`.
  const { upcoming, galleries } = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      const upcoming = yield* repo.findAll();
      // Photo galleries linked to this event (#1471), chronological. Resilient:
      // a Sanity hiccup degrades to "no galleries" rather than failing the page.
      const galleries: GalleryCardVM[] = yield* PhotoGalleryRepository.pipe(
        Effect.flatMap((repo) => repo.findByLinkedEvent(event.id)),
        Effect.catchAllCause(() => Effect.succeed<GalleryCardVM[]>([])),
      );
      return { upcoming, galleries };
    }).pipe(Effect.orDie),
  );

  const canonicalUrl = `${SITE_CONFIG.siteUrl}/evenementen/${event.slug}`;
  const otherEvents = upcoming.filter((other) => other.id !== event.id);

  // #2443 rule 2: galleries above siblings — the opposite order from today's
  // page, where <AndereEvents> renders above <GallerySection>.
  const relatedRowItems = mergeRelatedRow({
    domain: mapGalleriesToRelatedRow(galleries),
    curated: [],
    reference: [],
    semantic: [],
    siblings: eventVMsToSiblingItems(otherEvents),
  });

  return (
    <div className="bg-cream">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Evenementen", url: `${SITE_CONFIG.siteUrl}/evenementen` },
          { name: event.title, url: canonicalUrl },
        ])}
      />
      <JsonLd
        data={buildEventJsonLd({
          name: event.title,
          startDate: event.dateStart,
          endDate: event.dateEnd ?? undefined,
          url: canonicalUrl,
          image: event.coverImageUrl ?? undefined,
          location: event.location ?? undefined,
        })}
      />

      <EventViewTracker eventSlug={event.slug} eventType={event.eventType} />

      <PageContainer as="main" className="pb-12">
        {/* Always the container's left edge, even though EventHero itself
            is centred (#2442 rule 3). */}
        <UpLink href="/evenementen" label="Evenementen" className="mb-6" />
        <EventHero
          title={event.title}
          eventType={event.eventType}
          dateStart={event.dateStart}
          dateEnd={event.dateEnd}
          location={event.location}
          cover={
            event.coverImageUrl ? (
              <Image
                src={event.coverImageUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 760px, 100vw"
                className="object-cover"
              />
            ) : undefined
          }
          ctas={
            <EventDetailCtas
              eventSlug={event.slug}
              eventId={event.id}
              eventTitle={event.title}
              dateStart={event.dateStart}
              dateEnd={event.dateEnd}
              location={event.location}
              description={`Evenement van KCVV Elewijt — meer info: ${canonicalUrl}`}
              canonicalUrl={canonicalUrl}
              externalUrl={event.externalLink?.url}
              externalLabel={event.externalLink?.label}
            />
          }
        />
      </PageContainer>

      {/* One mixed, cross-type onward-navigation slot (#2443/#2581) —
          galleries linked to this event, then other upcoming events.
          Auto-hides on empty. */}
      <RelatedRow items={relatedRowItems} pageType="event" pageSlug={slug} />
    </div>
  );
}
