/**
 * Photo gallery detail page (`/galerij/[slug]`).
 *
 * Renders the gallery's thumbnail grid + `yet-another-react-lightbox` viewer
 * (`<GalleryLightbox>`), with an optional intro paragraph. `gallery_open`
 * fires client-side on mount via `<GalleryOpenTracker>`; the lightbox fires
 * `gallery_image_view` per navigation. Long (24h) ISR — galleries change rarely.
 *
 * Ends on `<RelatedRow>` (#2443/#2581) — this was the one true dead end on
 * the site before this decision (every other detail page had *some* onward
 * affordance). Domain tier: the event this gallery documents, when there is
 * one (`linkedEvent`, a real Sanity reference). Auto-hides at zero, which is
 * common here — most galleries have no linked event.
 */

import type { Metadata } from "next";
import { cache, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { Effect } from "effect";
import { PortableText, type PortableTextComponents } from "@portabletext/react";

import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import { PhotoGalleryRepository } from "@/lib/repositories/photoGallery.repository";
import type { GALLERY_SLUGS_QUERY_RESULT } from "@/lib/sanity/sanity.types";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { MonoLabel, PageContainer } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { formatArticleDate } from "@/lib/utils/dates";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox/GalleryLightbox";
import { GalleryOpenTracker } from "@/components/gallery/GalleryOpenTracker/GalleryOpenTracker";
import { RelatedRow } from "@/components/related/RelatedRow";
import { mergeRelatedRow } from "@/components/related/mergeRelatedRow";
import type { RelatedRowItem } from "@/components/related/types";

interface GalleryPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86400;

/** First gallery image at 1200×630 for the social share card. */
function ogImageUrl(url: string | null | undefined): string | null {
  return url ? `${url}?w=1200&h=630&fit=crop&auto=format` : null;
}

/** Minimal serializers for the gallery intro — paragraphs + links only. */
const descriptionComponents: PortableTextComponents = {
  marks: {
    link: ({
      children,
      value,
    }: {
      children?: ReactNode;
      value?: { href?: string };
    }) => {
      const href =
        typeof value?.href === "string" && value.href.length > 0
          ? value.href
          : "#";
      const external = href.startsWith("http");
      return (
        <a
          href={href}
          className="text-jersey-deep underline underline-offset-2"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      );
    },
  },
};

export async function generateStaticParams() {
  // Section (of the build), not a request-time subject: an empty list here
  // just means every slug renders on demand instead of being pre-enumerated
  // — `dynamicParams` still serves them (#2864). The outer try/catch also
  // covers `AppLayer` construction failing (e.g. a missing `KCVV_API_URL`) —
  // that happens outside the effect `degradeSection`'s `catchAllCause`
  // wraps, so an in-effect catch alone would let it fail the whole build.
  let slugs: GALLERY_SLUGS_QUERY_RESULT = [];
  try {
    slugs = await runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* PhotoGalleryRepository;
          return yield* repo.findAllSlugs();
        }),
        [],
        "[galerij/[slug]] generateStaticParams read failed; falling back to on-demand rendering.",
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

// Subject read: the gallery is this page's entire content, so a failed
// read takes it down with it via `Effect.orDie` (#2864). Wrapped in React
// `cache()` so the same-segment `layout.tsx` (existence check, #2968),
// `generateMetadata` below, and the page component share one read per
// request instead of three (#2441).
export const fetchGalleryOrNull = cache(async function fetchGalleryOrNull(
  slug: string,
) {
  return runPromise(
    Effect.gen(function* () {
      const repo = yield* PhotoGalleryRepository;
      return yield* repo.findBySlug(slug);
    }).pipe(Effect.orDie),
  );
});

export async function generateMetadata({
  params,
}: GalleryPageProps): Promise<Metadata> {
  const { slug } = await params;
  // Subject read: this route's metadata is entirely about this one gallery,
  // so a failed read takes it down with it — `null` (genuinely no such
  // gallery) is the only case that degrades to the "niet gevonden" fallback
  // (#2864).
  const gallery = await fetchGalleryOrNull(slug);
  if (!gallery)
    return {
      title: "Galerij niet gevonden",
      // #2963/#2968: belt-and-braces. The same-segment `layout.tsx` now
      // gets a real 404 here, but this noindex stays in case a future
      // `loading.tsx`/ancestor boundary ever reintroduces the soft 200.
      robots: { index: false, follow: false },
    };

  const description =
    gallery.descriptionText || `Foto's van ${gallery.title} — KCVV Elewijt`;
  const og = ogImageUrl(gallery.images?.[0]?.url);

  return {
    title: gallery.title,
    description,
    alternates: { canonical: `${SITE_CONFIG.siteUrl}/galerij/${slug}` },
    openGraph: {
      title: gallery.title,
      description,
      type: "website",
      images: og
        ? [{ url: og, alt: gallery.images?.[0]?.alt || gallery.title }]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function GalleryDetailPage({ params }: GalleryPageProps) {
  const { slug } = await params;
  // Subject read: the gallery is this page's entire content, so a failed
  // read takes it down with it — `null` (genuinely no such gallery) is the
  // only case that resolves to `notFound()` (#2864). The same-segment
  // `layout.tsx` already ran this exact check before the shell flushed
  // (#2968); `cache()` means this call reuses that read.
  const gallery = await fetchGalleryOrNull(slug);

  if (!gallery) notFound();

  const images = gallery.images ?? [];
  const canonicalUrl = `${SITE_CONFIG.siteUrl}/galerij/${gallery.slug}`;

  // Domain tier (#2443 rule 4): the event this gallery documents — bounded
  // (at most one) and defining. `linkedMatch` (a bare string) deliberately
  // has no equivalent here — see `GALLERY_BY_SLUG_QUERY`'s docblock.
  // `title`/`slug` are both `coalesce(..., "")` in the query, so an event
  // with a missing slug must be guarded here the same way
  // `mapCuratedEntry`'s own event branch already does (review round 1,
  // #2788) — otherwise it renders an empty-titled card linking to the
  // `/evenementen` archive instead of a specific event.
  const linkedEvent =
    gallery.linkedEvent &&
    gallery.linkedEvent.slug !== "" &&
    gallery.linkedEvent.title !== ""
      ? gallery.linkedEvent
      : null;
  const domainItems: RelatedRowItem[] = linkedEvent
    ? [
        {
          title: linkedEvent.title,
          href: `/evenementen/${linkedEvent.slug}`,
          imageUrl: linkedEvent.coverImageUrl ?? undefined,
          badge: "EVENEMENT",
          date: linkedEvent.dateStart
            ? formatArticleDate(linkedEvent.dateStart)
            : undefined,
          analyticsId: linkedEvent.id,
          analyticsSource: "domain",
          analyticsType: "event",
          analyticsTargetSlug: linkedEvent.slug,
        },
      ]
    : [];

  const relatedRowItems = mergeRelatedRow({
    domain: domainItems,
    curated: [],
    reference: [],
    semantic: [],
    siblings: [],
  });

  return (
    <div className="bg-cream">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Fotogalerij", url: `${SITE_CONFIG.siteUrl}/galerij` },
          { name: gallery.title, url: canonicalUrl },
        ])}
      />

      <GalleryOpenTracker
        gallerySlug={gallery.slug}
        imageCount={images.length}
      />

      <PageContainer as="main" className="pb-12 lg:pb-16">
        <PageHero
          register="minimal"
          kicker="KCVV Elewijt · Beelden"
          headline={gallery.title}
          upLink={{ href: "/galerij", label: "Fotogalerij" }}
        >
          {gallery.publishedAt && (
            <p className="mt-3">
              <MonoLabel tone="ink">
                <time>{formatArticleDate(gallery.publishedAt)}</time>
              </MonoLabel>
            </p>
          )}
          {gallery.descriptionRich && gallery.descriptionRich.length > 0 && (
            <div className="text-body-md text-ink mt-6 max-w-prose space-y-3">
              <PortableText
                value={gallery.descriptionRich}
                components={descriptionComponents}
              />
            </div>
          )}
        </PageHero>

        <GalleryLightbox gallerySlug={gallery.slug} images={images} />
      </PageContainer>

      {/* This route was the one true dead end on the site (#2443
          resolution) — auto-hides when the gallery has no linked event. */}
      <RelatedRow
        items={relatedRowItems}
        pageType="gallery"
        pageSlug={gallery.slug}
      />
    </div>
  );
}
