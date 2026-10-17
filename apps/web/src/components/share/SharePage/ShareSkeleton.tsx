import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";

/**
 * Skeleton of the `/share` tool — mirrors the `<SharePage>` tool: a template
 * picker, match/player selectors, and the share-image canvas preview. Prose
 * width to match the page (`PageContainer width="prose"`). Square cream/ink
 * paper chrome; no gray/rounded. The route's `loading.tsx` shows it while the
 * server reads; `SharePage` shows it again until hydration, when the tool
 * restores the stored story.
 */
export function ShareSkeleton() {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Deelafbeelding-tool laden…" />

      <PageContainer width="prose" className="flex flex-col gap-6 py-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-3/4" />
        </div>

        {/* Template picker — row of paper buttons */}
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream-soft shadow-paper-sm h-10 w-28 border-2"
            >
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>

        {/* Selector fields */}
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-2.5 w-20" />
              <div className="border-ink bg-cream h-11 w-full border-2">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Canvas preview */}
        <div className="border-ink bg-cream-soft shadow-paper-md aspect-[1200/630] w-full border-2">
          <Skeleton className="h-full w-full" />
        </div>
      </PageContainer>
    </div>
  );
}
