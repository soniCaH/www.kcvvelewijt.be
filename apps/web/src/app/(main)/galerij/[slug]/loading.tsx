/**
 * Photo Gallery Detail Page — Loading Skeleton.
 *
 * Mirrors `/galerij/[slug]`: the shared opening's quiet register (kicker +
 * gallery title + optional date/description) over `<GalleryLightbox>`'s
 * thumbnail grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, `aspect-square`
 * tiles).
 *
 * The headline is the gallery's own CMS title — data — so per #2432 §2 this
 * renders no heading text at all, bars only.
 */

import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { PageHeroSkeleton } from "@/components/layout/PageHero";

export default function GalleryDetailLoading() {
  return (
    <div className="bg-cream">
      <LoadingAnnouncement label="Fotogalerij laden…" />

      <PageContainer as="main" className="pb-12 lg:pb-16">
        {/* Kicker + headline bars — the shared <PageHeroSkeleton
            register="minimal"> rather than a second hand-drawn copy of its
            OpeningBars. The date line below it is this route's own (the
            real page's MonoLabel<time> child, not part of the opening). */}
        <PageHeroSkeleton
          register="minimal"
          className="mb-0"
          upLink={{ href: "/galerij", label: "Fotogalerij" }}
        />
        <div className="mt-3 mb-10" aria-hidden="true">
          <Skeleton className="h-4 w-32" />
        </div>

        <ul
          aria-hidden="true"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="aspect-square w-full" />
            </li>
          ))}
        </ul>
      </PageContainer>
    </div>
  );
}
