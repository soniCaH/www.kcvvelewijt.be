/**
 * Photo gallery detail page (`/galerij/[slug]`).
 *
 * Renders the gallery's thumbnail grid + `yet-another-react-lightbox` viewer
 * (`<GalleryLightbox>`), with an optional intro paragraph. `gallery_open`
 * fires client-side on mount via `<GalleryOpenTracker>`; the lightbox fires
 * `gallery_image_view` per navigation. Long (24h) ISR — galleries change rarely.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Effect } from "effect";
import { PortableText, type PortableTextComponents } from "@portabletext/react";

import { runPromise } from "@/lib/effect/runtime";
import { PhotoGalleryRepository } from "@/lib/repositories/photoGallery.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import {
  EditorialHeading,
  MonoLabel,
  PageContainer,
} from "@/components/design-system";
import { formatArticleDate } from "@/lib/utils/dates";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox/GalleryLightbox";
import { GalleryOpenTracker } from "@/components/gallery/GalleryOpenTracker/GalleryOpenTracker";

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
  try {
    const slugs = await runPromise(
      Effect.gen(function* () {
        const repo = yield* PhotoGalleryRepository;
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
}: GalleryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await runPromise(
    Effect.gen(function* () {
      const repo = yield* PhotoGalleryRepository;
      return yield* repo.findBySlug(slug);
    }),
  );
  if (!gallery) return { title: "Galerij niet gevonden" };

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
  const gallery = await runPromise(
    Effect.gen(function* () {
      const repo = yield* PhotoGalleryRepository;
      return yield* repo.findBySlug(slug);
    }),
  );

  if (!gallery) notFound();

  const images = gallery.images ?? [];
  const canonicalUrl = `${SITE_CONFIG.siteUrl}/galerij/${gallery.slug}`;

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

      <PageContainer as="main" className="py-12">
        <header className="mb-8">
          <MonoLabel tone="ink">KCVV Elewijt · Beelden</MonoLabel>
          <EditorialHeading
            level={1}
            size="display-xl"
            tone="ink"
            className="mt-2"
          >
            {gallery.title}
          </EditorialHeading>
          {gallery.publishedAt && (
            <p className="mt-3">
              <MonoLabel tone="ink">
                <time>{formatArticleDate(gallery.publishedAt)}</time>
              </MonoLabel>
            </p>
          )}
          {gallery.descriptionRich && gallery.descriptionRich.length > 0 && (
            <div className="text-body-md text-ink-soft mt-6 max-w-prose space-y-3">
              <PortableText
                value={gallery.descriptionRich}
                components={descriptionComponents}
              />
            </div>
          )}
        </header>

        <GalleryLightbox gallerySlug={gallery.slug} images={images} />
      </PageContainer>
    </div>
  );
}
