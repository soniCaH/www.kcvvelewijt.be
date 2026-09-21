import { notFound } from "next/navigation";
import { fetchGalleryOrNull } from "./page";

interface GalleryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968). See `(main)/spelers/[slug]/layout.tsx` for the full
 * mechanism doc. `galerij/(index)/` (the listing hub) is a sibling route
 * group, not an ancestor of this `[slug]` segment (#2791/#3037), so there is
 * no boundary above this layout.
 *
 * **Skeleton trade-off (recorded decision, PR #3057 body):**
 * `GalleryDetailPage` renders straight from the same `fetchGalleryOrNull`
 * this layout already awaited — no read is left after this existence check
 * — so this segment's `loading.tsx` no longer has anything to suspend on
 * and is effectively retired for a server-rendered navigation. It still
 * fires on a prefetched client-side navigation. The file is kept, not
 * deleted: same total work, moved earlier, for a real 404.
 */
export default async function GalleryLayout({
  children,
  params,
}: GalleryLayoutProps) {
  const { slug } = await params;
  const gallery = await fetchGalleryOrNull(slug);
  if (!gallery) notFound();
  return children;
}
