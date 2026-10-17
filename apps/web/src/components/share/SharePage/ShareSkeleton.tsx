import { Skeleton, LoadingAnnouncement } from "@/components/design-system";

/**
 * Skeleton of the `/share` tool — mirrors the `<SharePage>` phone layout: the
 * full-screen layer (same `#share-tool` id, so the site chrome is gone while
 * it loads too), the story preview, the look strip and the bottom tab bar.
 * Square cream/ink paper chrome; no gray/rounded. The route's `loading.tsx`
 * shows it while the server reads; `SharePage` shows it again until
 * hydration, when the tool restores the stored story.
 */
export function ShareSkeleton() {
  return (
    <div
      id="share-tool"
      className="bg-cream fixed inset-0 z-[55] flex flex-col"
    >
      <LoadingAnnouncement label="Deelafbeelding-tool laden…" />
      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
        {/* Story preview */}
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 pt-3 pb-2">
          <div className="border-ink bg-cream-soft aspect-[9/16] h-full max-w-full border-2">
            <Skeleton className="h-full w-full" />
          </div>
        </div>

        {/* Look strip */}
        <div className="border-paper-edge flex gap-2 border-t px-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[85px] w-12" />
          ))}
        </div>

        {/* Tab bar + Bewaar PNG */}
        <div className="flex gap-1.5 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-ink/30 h-12 flex-1 border-2">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
          <div className="bg-jersey-deep h-12 flex-[1.6]" />
        </div>
      </div>
    </div>
  );
}
