/**
 * Event detail page (`/evenementen/[slug]`).
 *
 * The editorial, cream counterpoint to the dark ticket-wall list (design lock
 * 6e5 — variant D "Editoriaal"): a centred `<EventHero>` with the Reserveer /
 * "Zet in agenda" CTAs, followed by an "Andere evenementen" `<TicketStub>` grid.
 * `event_view` fires client-side via `<EventViewTracker>`; the CTAs fire
 * `event_detail_cta_click`. `/events/[slug]` 301s here (see `next.config.ts`).
 */

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Effect } from "effect";

import { runPromise } from "@/lib/effect/runtime";
import { EventRepository } from "@/lib/repositories/event.repository";
import {
  PhotoGalleryRepository,
  type GalleryCardVM,
} from "@/lib/repositories/photoGallery.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildEventJsonLd } from "@/lib/seo/jsonld";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { PageContainer } from "@/components/design-system";
import { EventHero } from "@/components/event/EventHero";
import { EventViewTracker } from "@/components/event/EventViewTracker";
import { AndereEvents } from "@/components/event/AndereEvents";
import { GallerySection } from "@/components/gallery/GallerySection/GallerySection";

import { EventDetailCtas } from "./EventDetailCtas";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const slugs = await runPromise(
      Effect.gen(function* () {
        const repo = yield* EventRepository;
        return yield* repo.findAllSlugs();
      }),
    );
    return slugs
      .filter((row): row is { slug: string; updatedAt: string } =>
        Boolean(row.slug),
      )
      .map((row) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      return yield* repo.findBySlug(slug);
    }),
  );
  if (!event) return { title: "Evenement niet gevonden | KCVV Elewijt" };

  const description = `${event.title} — Evenement van KCVV Elewijt`;

  return {
    title: `${event.title} | KCVV Elewijt`,
    description,
    alternates: { canonical: `${SITE_CONFIG.siteUrl}/evenementen/${slug}` },
    openGraph: {
      title: event.title,
      description,
      type: "website",
      images: event.coverImageUrl
        ? [{ url: event.coverImageUrl, alt: event.title }]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
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
    }),
  );

  // GROQ projects `dateStart` via `coalesce(dateStart, "")`; an event with
  // `dateStart` cleared in Studio (or written via the API bypassing schema
  // validation) would render `Invalid DateTime`. Treat as 404 instead.
  if (!event || !event.dateStart) notFound();

  const canonicalUrl = `${SITE_CONFIG.siteUrl}/evenementen/${event.slug}`;
  const otherEvents = upcoming.filter((other) => other.id !== event.id);

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

      <PageContainer as="main" className="py-12">
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
                alt={event.title}
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

        <AndereEvents events={otherEvents} />
      </PageContainer>

      {/* Photo galleries linked to this event (#1471) — auto-hides on empty. */}
      <GallerySection galleries={galleries} kicker="KCVV Elewijt · Beelden" />
    </div>
  );
}
