import { PageContainer } from "@/components/design-system";

/**
 * Loading skeleton for `/share` — mirrors the `<SharePage>` tool: a template
 * picker, match/player selectors, and the share-image canvas preview. Prose
 * width to match the page (`PageContainer width="prose"`). Square cream/ink
 * paper chrome; no gray/rounded.
 */
export default function ShareLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <span role="status" aria-busy="true" className="sr-only">
        Deelafbeelding-tool laden…
      </span>

      <PageContainer width="prose" className="flex flex-col gap-6 py-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="bg-cream-deep h-3 w-24 motion-safe:animate-pulse" />
          <div className="bg-paper-edge h-8 w-3/4 motion-safe:animate-pulse" />
        </div>

        {/* Template picker — row of paper buttons */}
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream-soft shadow-paper-sm h-10 w-28 border-2 motion-safe:animate-pulse"
            />
          ))}
        </div>

        {/* Selector fields */}
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="bg-cream-deep h-2.5 w-20 motion-safe:animate-pulse" />
              <div className="border-ink bg-cream h-11 w-full border-2 motion-safe:animate-pulse" />
            </div>
          ))}
        </div>

        {/* Canvas preview */}
        <div className="border-ink bg-cream-soft shadow-paper-md aspect-[1200/630] w-full border-2 motion-safe:animate-pulse" />
      </PageContainer>
    </div>
  );
}
