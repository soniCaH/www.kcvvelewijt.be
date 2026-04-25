/**
 * Event Detail Page
 * Displays individual editorial events from Sanity.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Effect } from "effect";

import { runPromise } from "@/lib/effect/runtime";
import { EventRepository } from "@/lib/repositories/event.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildEventJsonLd } from "@/lib/seo/jsonld";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { formatLongDate, formatDate } from "@/lib/utils/dates";
import { FooterSafeArea } from "@/components/design-system";
import { ChevronLeft, ExternalLink } from "@/lib/icons";

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
    alternates: { canonical: `${SITE_CONFIG.siteUrl}/events/${slug}` },
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
  const event = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      return yield* repo.findBySlug(slug);
    }),
  );

  // GROQ projects `dateStart` via `coalesce(dateStart, "")`; an event with
  // `dateStart` cleared in Studio (or written via the API bypassing schema
  // validation) would render `Invalid DateTime`. Treat as 404 instead.
  if (!event || !event.dateStart) notFound();

  const canonicalUrl = `${SITE_CONFIG.siteUrl}/events/${event.slug}`;
  const startDate = new Date(event.dateStart);
  const endDate = event.dateEnd ? new Date(event.dateEnd) : null;
  const sameDay =
    endDate !== null && startDate.toDateString() === endDate.toDateString();

  const externalLinkUrl = event.externalLink?.url;
  const externalLinkLabel =
    event.externalLink?.label?.trim() || "Meer informatie";

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white pb-[var(--footer-diagonal)]">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Evenementen", url: `${SITE_CONFIG.siteUrl}/events` },
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
        })}
      />

      <header className="from-green-main via-green-hover to-green-dark-hover relative overflow-hidden bg-linear-to-br px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/events"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Terug naar evenementen
          </Link>
          <h1 className="font-title mb-4 text-4xl font-bold md:text-6xl">
            {event.title}
          </h1>
          <p className="text-xl text-white/90 md:text-2xl">
            {sameDay && endDate
              ? `${formatLongDate(startDate)} · ${formatDate(startDate, "HH:mm")} – ${formatDate(endDate, "HH:mm")}`
              : endDate
                ? `${formatLongDate(startDate)} – ${formatLongDate(endDate)}`
                : formatLongDate(startDate)}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {event.coverImageUrl && (
          <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={event.coverImageUrl}
              alt={event.title}
              fill
              priority
              sizes="(min-width: 1024px) 960px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        {externalLinkUrl && (
          <div className="flex justify-center">
            <a
              href={externalLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-kcvv-green-bright hover:bg-kcvv-green inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium text-white transition-colors"
            >
              {externalLinkLabel}
              <ExternalLink className="ml-2 h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        )}
      </main>

      <FooterSafeArea />
    </div>
  );
}
