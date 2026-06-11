/**
 * `/hulp` hub — route-level loading skeleton.
 *
 * Cream-paper placeholder shaped like the hub (sticky two-door nav · dark hero
 * band · finder), shown for cold navigations before the RSC payload arrives.
 * Mirrors the hub shell (page.tsx) rather than the retired SectionStack layout.
 */
export default function HulpLoading() {
  return (
    <div className="bg-cream min-h-screen" role="status" aria-busy="true">
      <span className="sr-only">Hulppagina laden…</span>

      {/* Sticky two-door nav placeholder. */}
      <div className="border-ink bg-cream border-b-2" aria-hidden>
        <div className="mx-auto flex max-w-[80rem] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="bg-cream-soft h-5 w-16 animate-pulse" />
          <div className="bg-cream-soft h-5 w-24 animate-pulse" />
          <div className="bg-cream-soft ml-auto h-9 w-44 animate-pulse" />
        </div>
      </div>

      <div
        className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
        aria-hidden
      >
        {/* Hero band. */}
        <div className="bg-jersey-deep-dark border-ink h-56 animate-pulse border-2 shadow-[6px_6px_0_0_var(--color-ink)]" />

        {/* Finder placeholder — heading · chips · accordion rows. */}
        <div className="mt-12 space-y-3">
          <div className="bg-cream-soft h-7 w-56 animate-pulse" />
          <div className="flex gap-2">
            <div className="bg-cream-soft h-8 w-20 animate-pulse" />
            <div className="bg-cream-soft h-8 w-24 animate-pulse" />
            <div className="bg-cream-soft h-8 w-28 animate-pulse" />
          </div>
          <div className="border-ink bg-cream h-14 animate-pulse border-2 shadow-[3px_3px_0_0_var(--color-ink)]" />
          <div className="border-ink bg-cream h-14 animate-pulse border-2 shadow-[3px_3px_0_0_var(--color-ink)]" />
          <div className="border-ink bg-cream h-14 animate-pulse border-2 shadow-[3px_3px_0_0_var(--color-ink)]" />
        </div>
      </div>
    </div>
  );
}
