import type { NewsCardRotation } from "@/components/article/NewsCard/NewsCard";
import type { GalleryCardVM } from "@/lib/repositories/photoGallery.repository";
import { formatArticleDate } from "@/lib/utils/dates";
import { GalleryCard } from "../GalleryCard/GalleryCard";

// Deterministic per-slot card rotation so the grid reads with paper-stamp
// variety without a random seed (stable across renders / VR baselines).
const ROTATION_POOL: readonly NewsCardRotation[] = ["a", "b", "c", "none"];

export interface GalleryCardGridProps {
  galleries: GalleryCardVM[];
  /** Heading level for each card's title. Default `h3`. */
  as?: "h2" | "h3";
}

/**
 * Responsive 3-up grid of `<GalleryCard>`. Adapts the repository VM (formats
 * the date, derives the link + a slot-cycled rotation) so callers — the
 * `/galerij` list and the match/event detail sections — pass the raw query
 * result straight through.
 */
export const GalleryCardGrid = ({
  galleries,
  as = "h3",
}: GalleryCardGridProps) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {galleries.map((gallery, i) => (
      <GalleryCard
        key={gallery.id}
        title={gallery.title}
        href={`/galerij/${gallery.slug}`}
        coverUrl={gallery.coverUrl}
        coverAlt={gallery.coverAlt || gallery.title}
        coverLqip={gallery.coverLqip}
        imageCount={gallery.imageCount}
        date={
          gallery.publishedAt
            ? formatArticleDate(gallery.publishedAt)
            : undefined
        }
        rotation={ROTATION_POOL[i % ROTATION_POOL.length]}
        as={as}
      />
    ))}
  </div>
);
