import type { GalleryCardVM } from "@/lib/repositories/photoGallery.repository";
import { formatArticleDate } from "@/lib/utils/dates";
import type { GalleryCardGridItem } from "./GalleryCardGrid";

/**
 * Adds the pre-formatted Dutch date a `<GalleryCardGrid>` renders.
 *
 * Its own module, deliberately: `<GalleryListingClient>` renders the grid on
 * the load-more path, so anything the grid imports crosses the client boundary
 * — and `formatArticleDate` pulls in Luxon. Only server code imports this.
 */
export const toGalleryCardGridItems = (
  galleries: GalleryCardVM[],
): GalleryCardGridItem[] => {
  return galleries.map((gallery) => ({
    ...gallery,
    date: gallery.publishedAt
      ? formatArticleDate(gallery.publishedAt)
      : undefined,
  }));
};
