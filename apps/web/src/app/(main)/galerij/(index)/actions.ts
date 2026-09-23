"use server";

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { orDieOrRenderOnDemand } from "@/lib/effect/or-die-or-render-on-demand";
import { PhotoGalleryRepository } from "@/lib/repositories/photoGallery.repository";
import {
  clampListingWindow,
  paginateResults,
  type Paginated,
} from "@/lib/utils/pagination";
import type { GalleryCardGridItem } from "@/components/gallery/GalleryCardGrid/GalleryCardGrid";
import { toGalleryCardGridItems } from "@/components/gallery/GalleryCardGrid/gallery-card-items";

/**
 * One page of `/galerij`, on the same 24 + 12 contract as `/nieuws` (#2569).
 *
 * The date is formatted here rather than in the grid: the grid is rendered by a
 * client component on the load-more path, and formatting there would drag Luxon
 * across the client boundary for a page that shipped no card JS at all.
 *
 * A Sanity failure is converted to a defect on purpose (`orDieOrRenderOnDemand`,
 * which at build leaves the page out instead of killing the build, #3135) and
 * left to throw: on the ISR path a throw serves the last good render, where a
 * caught empty list would be cached as if it were the truth (#2433). On the
 * load-more path the client catches it and offers a retry.
 */
export async function fetchGalleriesAction(params: {
  offset: number;
  limit: number;
}): Promise<Paginated<GalleryCardGridItem>> {
  const { offset, limit } = clampListingWindow(params);

  const rows = await runPromise(
    Effect.gen(function* () {
      const repo = yield* PhotoGalleryRepository;
      return yield* repo.findPaginated({ offset, limit: limit + 1 });
    }).pipe(orDieOrRenderOnDemand),
  );

  return paginateResults(toGalleryCardGridItems(rows), limit);
}
