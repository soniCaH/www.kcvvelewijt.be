import { FilterTabsSkeleton, Skeleton } from "@/components/design-system";

/**
 * `<EventsBrowser>` loading skeleton — the filter chip row + month-grouped
 * ticket list only (not the page's opening, which is static and renders
 * outside any loading boundary). The route's ONLY caller now:
 * `apps/web/src/app/(main)/evenementen/(index)/loading.tsx` (the navigation-triggered
 * full-page skeleton). `page.tsx` no longer wraps `<EventsBrowser>` in a
 * local `<Suspense>` — that component reads its active facet from
 * `window.location` on mount rather than `useSearchParams` (#2564 review
 * item 2), so the whole page stays server-prerendered and never shows a
 * loading skeleton for its own subtree.
 *
 * The chip row is the shared `<FilterTabsSkeleton>` (#2564 review item 4) —
 * one definition of the real row's shape (single-line, non-wrapping,
 * `gap-3`, `h-9` chips), not a bespoke redraw of it.
 */
export function EventsBrowserSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-8">
      <FilterTabsSkeleton
        surface="inverse"
        widths={["w-16", "w-28", "w-32", "w-28", "w-20"]}
      />

      {/* Month-grouped ticket list. */}
      <div className="flex flex-col gap-12">
        {Array.from({ length: 2 }).map((_, m) => (
          <section key={m}>
            <Skeleton tone="dark" className="mb-4 h-9 w-48" />
            <ul className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="border-cream/40 bg-cream/5 flex items-stretch border-2"
                >
                  <div className="border-cream/40 flex w-[72px] shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed py-4">
                    <Skeleton tone="dark" className="h-6 w-8" />
                    <Skeleton tone="dark" className="h-2 w-10" />
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-4">
                    <Skeleton tone="dark" className="h-4 w-1/2" />
                    <Skeleton tone="dark" className="h-3 w-2/3" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
