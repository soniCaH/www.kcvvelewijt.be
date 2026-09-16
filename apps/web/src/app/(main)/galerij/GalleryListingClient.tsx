"use client";

import { useCallback, useRef, useState } from "react";
import { LoadMoreFooter } from "@/components/design-system";
import {
  GalleryCardGrid,
  type GalleryCardGridItem,
} from "@/components/gallery/GalleryCardGrid/GalleryCardGrid";
import { LISTING_BATCH_SIZE } from "@/lib/constants";
import { deduplicateById, type Paginated } from "@/lib/utils/pagination";

interface GalleryListingClientProps {
  initialGalleries: GalleryCardGridItem[];
  hasMore: boolean;
  fetchGalleries: (params: {
    offset: number;
    limit: number;
  }) => Promise<Paginated<GalleryCardGridItem>>;
}

/**
 * The `/galerij` list plus its load-more. Galleries never drop off, so this is
 * the only listing besides `/nieuws` whose payload grows without a bound — it
 * takes the same 24 + 12 contract rather than growing a second idiom (#2569).
 */
export function GalleryListingClient({
  initialGalleries,
  hasMore: initialHasMore,
  fetchGalleries,
}: GalleryListingClientProps) {
  const [galleries, setGalleries] = useState(initialGalleries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const isLoadingRef = useRef(false);
  // Advanced by the RAW row count, not by what survived the dedup below —
  // deriving the offset from the rendered length stalls the button when a
  // whole batch of already-seen rows comes back (mirrors `NewsListingClient`).
  const nextOffsetRef = useRef(initialGalleries.length);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(false);

    try {
      const result = await fetchGalleries({
        offset: nextOffsetRef.current,
        limit: LISTING_BATCH_SIZE,
      });
      nextOffsetRef.current += result.items.length;
      setGalleries((prev) => [
        ...prev,
        ...deduplicateById(result.items, new Set(prev.map((g) => g.id))),
      ]);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("[loadMore] Failed to load galleries:", err);
      setError(true);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, fetchGalleries]);

  return (
    <>
      <GalleryCardGrid galleries={galleries} as="h2" />
      <LoadMoreFooter
        label="Meer foto's laden"
        hasMore={hasMore}
        isLoading={isLoading}
        error={
          error
            ? { message: "Fotogalerijen laden mislukt.", emphasis: "mislukt" }
            : undefined
        }
        onLoadMore={loadMore}
      />
    </>
  );
}
