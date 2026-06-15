/**
 * Staff Detail Page — Loading Skeleton.
 *
 * Mirrors the `/spelers/[slug]` skeleton at the chrome level — a bare hero
 * grid (figure on the LEFT for staff), a seam bar, and a bio paragraph
 * footprint on a cream band — over the near-white page background. Bars stay
 * sharp-cornered per the redesign vocabulary.
 */

export default function StaffDetailLoading() {
  return (
    <div className="min-h-screen">
      <span role="status" aria-live="polite" className="sr-only">
        Stafprofiel laden...
      </span>

      {/* Hero footprint — figure left, text right (mirrors PlayerHero). */}
      <section
        aria-hidden="true"
        className="mx-auto w-full max-w-[var(--container-wide)] animate-pulse px-4 py-12 lg:px-8 lg:py-16"
      >
        <div className="grid grid-cols-1 items-start gap-x-10 gap-y-8 sm:grid-cols-[minmax(220px,320px)_1fr]">
          <div className="bg-paper-edge aspect-[3/4] w-full max-w-[320px] justify-self-start" />
          <div className="flex flex-col gap-5">
            <div className="bg-paper-edge h-4 w-16" />
            <div className="space-y-2">
              <div className="bg-paper-edge h-12 w-3/4" />
              <div className="bg-paper-edge h-10 w-2/3" />
            </div>
            <div className="flex gap-2">
              <div className="bg-paper-edge h-6 w-28" />
              <div className="bg-paper-edge h-6 w-20" />
            </div>
            <div className="bg-paper-edge h-3 w-48" />
          </div>
        </div>
      </section>

      {/* Single seam bar (matches the page's lone post-hero seam). */}
      <div aria-hidden="true" className="bg-paper-edge h-[18px] w-full" />

      {/* Bio footprint — cream band. */}
      <section
        aria-hidden="true"
        className="bg-cream mx-auto w-full max-w-[var(--container-wide)] animate-pulse px-4 py-12 lg:px-8 lg:py-16"
      >
        <div className="space-y-3">
          <div className="bg-paper-edge h-4 w-full" />
          <div className="bg-paper-edge h-4 w-11/12" />
          <div className="bg-paper-edge h-4 w-10/12" />
        </div>
      </section>
    </div>
  );
}
