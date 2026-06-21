/**
 * Photo gallery list page (`/galerij`).
 *
 * Renders every published `photoGallery` (newest first) as retro-terrace
 * `<GalleryCard>`s — cover in colour newsprint, photo count, title and date.
 * Galleries change rarely, so the page uses a long (24h) ISR revalidate;
 * publishing a gallery revalidates it immediately once the #1921 Scope E
 * webhook map lands (see PR notes).
 */

import type { Metadata } from "next";
import { Effect } from "effect";

import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { runPromise } from "@/lib/effect/runtime";
import { PhotoGalleryRepository } from "@/lib/repositories/photoGallery.repository";
import {
  EditorialHeading,
  MonoLabel,
  PageContainer,
} from "@/components/design-system";
import { GalleryCardGrid } from "@/components/gallery/GalleryCardGrid/GalleryCardGrid";

export const metadata: Metadata = {
  title: "Fotogalerij | KCVV Elewijt",
  description:
    "Foto's van wedstrijden, evenementen en clubmomenten van KCVV Elewijt.",
  keywords: ["foto's", "galerij", "fotogalerij", "beelden", "KCVV Elewijt"],
  openGraph: {
    title: "Fotogalerij - KCVV Elewijt",
    description: "Foto's van wedstrijden, evenementen en clubmomenten",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

// Galleries change rarely — 24h ISR (align with #1921).
export const revalidate = 86400;

export default async function GalerijPage() {
  const galleries = await runPromise(
    Effect.gen(function* () {
      const repo = yield* PhotoGalleryRepository;
      return yield* repo.findAll();
    }),
  );

  return (
    <div className="bg-cream flex min-h-screen flex-col">
      <PageContainer as="header" width="index" className="pt-12 pb-8">
        <MonoLabel tone="ink">KCVV Elewijt · Beelden</MonoLabel>
        <EditorialHeading
          level={1}
          size="display-xl"
          tone="ink"
          className="mt-2"
        >
          Fotogalerij
        </EditorialHeading>
      </PageContainer>

      <PageContainer as="main" width="index" className="flex-1 pb-16">
        {galleries.length === 0 ? (
          <p className="text-body-md text-ink-soft">
            Er zijn nog geen fotogalerijen gepubliceerd.
          </p>
        ) : (
          <GalleryCardGrid galleries={galleries} as="h2" />
        )}
      </PageContainer>
    </div>
  );
}
