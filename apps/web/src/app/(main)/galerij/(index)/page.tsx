/**
 * Photo gallery list page (`/galerij`).
 *
 * Renders published `photoGallery` documents (newest first) as retro-terrace
 * `<GalleryCard>`s — cover in colour newsprint, photo count, title and date.
 * Paints 24 and appends 12 per click: galleries never drop off, so this is the
 * one listing besides `/nieuws` whose payload grows without a bound (#2569).
 * Galleries change rarely, so the page uses a long (24h) ISR revalidate;
 * publishing a gallery revalidates it immediately once the #1921 Scope E
 * webhook map lands (see PR notes).
 */

import { LISTING_INITIAL_TOTAL, SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { EmptyState, PageContainer } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { pendingEmptyBody } from "@/lib/utils/empty-state-copy";
import { fetchGalleriesAction } from "./actions";
import { GalleryListingClient } from "./GalleryListingClient";

// Exported so `loading.tsx` can reuse the real, unshimmered opening (#2432
// §2) instead of a second hand-typed copy that can silently drift from this
// one.
export const GALERIJ_KICKER = "KCVV Elewijt · Beelden";
export const GALERIJ_HEADLINE = "Fotogalerij";

export const metadata = buildPageMetadata({
  title: "Fotogalerij",
  description:
    "Foto's van wedstrijden, evenementen en clubmomenten van KCVV Elewijt.",
  path: "/galerij",
  ogTitle: "Fotogalerij - KCVV Elewijt",
  ogDescription: "Foto's van wedstrijden, evenementen en clubmomenten",
  keywords: ["foto's", "galerij", "fotogalerij", "beelden", "KCVV Elewijt"],
});

// Galleries change rarely — 24h ISR (align with #1921).
export const revalidate = 86400;

export default async function GalerijPage() {
  const initial = await fetchGalleriesAction({
    offset: 0,
    limit: LISTING_INITIAL_TOTAL,
  });

  return (
    <div className="bg-cream flex min-h-screen flex-col">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Galerij", url: `${SITE_CONFIG.siteUrl}/galerij` },
        ])}
      />
      {/* The opening and the listing are ONE padded section, not two stacked on
          the same colour (#2479 rule 3). */}
      <PageContainer as="main" width="index" className="flex-1 py-12 sm:py-16">
        <PageHero
          register="minimal"
          kicker={GALERIJ_KICKER}
          headline={GALERIJ_HEADLINE}
        />
        {initial.items.length === 0 ? (
          <EmptyState tier="surface" heading="Nog geen fotogalerijen">
            {pendingEmptyBody("we een fotogalerij publiceren", "ze")}
          </EmptyState>
        ) : (
          <GalleryListingClient
            initialGalleries={initial.items}
            hasMore={initial.hasMore}
            fetchGalleries={fetchGalleriesAction}
          />
        )}
      </PageContainer>
    </div>
  );
}
