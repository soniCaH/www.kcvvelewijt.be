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

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  // Subject read: this route's metadata is entirely about this one event, so
  // a failed read takes it down with it — `null` (genuinely no such event)
  // is the only case that degrades to the "niet gevonden" fallback (#2864).
  const event = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      return yield* repo.findBySlug(slug);
    }).pipe(Effect.orDie),
  );
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
  // The event is the page's subject — a failed `findBySlug` (or the sibling
  // `findAll` feed it gates) takes the page down with it via `Effect.orDie`
  // below. `galleries` is a section and already degrades independently with
  // its own `catchAllCause` (#2864).
  const { event, upcoming, galleries } = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      const event = yield* repo.findBySlug(slug);
      // Skip the (upcoming-only) feed fetch for a missing event — the page 404s.
      const upcoming = event ? yield* repo.findAll() : [];
      // Photo galleries linked to this event (#1471), chronological. Resilient:
      // a Sanity hiccup degrades to "no galleries" rather than failing the page.
      const galleries: GalleryCardVM[] = event
        ? yield* PhotoGalleryRepository.pipe(
            Effect.flatMap((repo) => repo.findByLinkedEvent(event.id)),
            Effect.catchAllCause(() => Effect.succeed<GalleryCardVM[]>([])),
          )
        : [];
      return { event, upcoming, galleries };
    }).pipe(Effect.orDie),
  );

  // GROQ projects `dateStart` via `coalesce(dateStart, "")`; an event with
  // `dateStart` cleared in Studio (or written via the API bypassing schema
  // validation) would render `Invalid DateTime`. Treat as 404 instead.
  if (!event || !event.dateStart) notFound();

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
