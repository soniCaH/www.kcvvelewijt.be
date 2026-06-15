/**
 * Staff Detail Page — Loading Skeleton
 * Mirrors the rebuilt page (#2124): person-profile hero (portrait + name +
 * pills + contact) → <StripedSeam> → bio prose column.
 */

import { FooterSafeArea, StripedSeam } from "@/components/design-system";

export default function StaffDetailLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <span role="status" aria-live="polite" className="sr-only">
        Stafprofiel laden...
      </span>

      {/* Hero skeleton — the <StaffHero> TapedCard shell: portrait slot +
          kicker / two-line name / role pills / contact row. */}
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-12">
        <div className="border-ink bg-cream shadow-paper-md border-2 p-8">
          <div className="grid items-center gap-6 md:grid-cols-[0.7fr_1.3fr]">
            <div className="border-ink bg-cream-soft shadow-paper-sm aspect-[3/4] w-full animate-pulse border-2" />
            <div className="animate-pulse space-y-4">
              <div className="bg-cream-soft h-3 w-16" />
              <div className="space-y-2">
                <div className="bg-cream-soft h-10 w-44" />
                <div className="bg-cream-soft h-10 w-60" />
              </div>
              <div className="flex gap-2">
                <div className="bg-cream-soft h-6 w-28" />
                <div className="bg-cream-soft h-6 w-20" />
              </div>
              <div className="bg-cream-soft h-4 w-48" />
            </div>
          </div>
        </div>
      </div>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Bio skeleton — mirrors the heading + <ArticleBody> prose column. */}
      <div className="bg-cream w-full px-4 py-12 lg:px-0 lg:py-16">
        <div
          className="mx-auto w-full animate-pulse space-y-4"
          style={{ maxWidth: "var(--container-prose)" }}
        >
          <div className="bg-cream-soft mb-6 h-8 w-40" />
          <div className="bg-cream-soft h-5 w-full" />
          <div className="bg-cream-soft h-5 w-full" />
          <div className="bg-cream-soft h-5 w-4/5" />
        </div>
      </div>

      <FooterSafeArea />
    </div>
  );
}
