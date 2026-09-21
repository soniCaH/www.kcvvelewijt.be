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
import { degradeSection } from "@/lib/effect/degrade";
import { EventRepository } from "@/lib/repositories/event.repository";
import type { EVENT_SLUGS_QUERY_RESULT } from "@/lib/sanity/sanity.types";
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

export async function generateStaticParams() {
  // Section (of the build), not a request-time subject: an empty list here
  // just means every slug renders on demand instead of being pre-enumerated
  // — `dynamicParams` still serves them (#2864). The outer try/catch also
  // covers `AppLayer` construction failing (e.g. a missing `KCVV_API_URL`) —
  // that happens outside the effect `degradeSection`'s `catchAllCause`
  // wraps, so an in-effect catch alone would let it fail the whole build.
  let slugs: EVENT_SLUGS_QUERY_RESULT = [];
  try {
    slugs = await runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findAllSlugs();
        }),
        [],
        "[evenementen/[slug]] generateStaticParams read failed; falling back to on-demand rendering.",
      ),
    );
  } catch {
    slugs = [];
  }
  return slugs
    .filter((row): row is { slug: string; updatedAt: string } =>
      Boolean(row.slug),
    )
    .map((row) => ({ slug: row.slug }));
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
      // #2963: this branch renders under a 200 (a `loading.tsx`
      // Suspense boundary flushes the shell before `notFound()` runs),
      // so noindex is what actually keeps it out of the index.
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

  // GROQ projects `dateStart` via `coalesce(dateStart, "")`; an event with
  // `dateStart` cleared in Studio (or written via the API bypassing schema
  // validation) would render `Invalid DateTime`. Treat as 404 instead. Kept
  // here too (not only in the layout) so this early return still short-
  // circuits the reads below for the type-narrowing compiler as much as for
  // runtime — `layout.tsx` applies the identical check first.
  if (!event || !event.dateStart) notFound();

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
