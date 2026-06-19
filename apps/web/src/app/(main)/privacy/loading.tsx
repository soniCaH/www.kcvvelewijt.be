/**
 * Privacy Policy Page — Loading Skeleton.
 *
 * Mirrors `PrivacyPage` (`/privacy`): the 8p1 cream-minimal composition — no
 * hero band. A prose header (mono kicker + display title + mono last-updated +
 * Freight lead) over a single prose column whose H2 sections are separated by
 * `<DottedDivider>` rules.
 *
 * Prose width (680). Canonical paper-register chrome — `paper-edge` pulse bars,
 * dotted ink dividers; no cards (the page is a flat reading column).
 */

import { DottedDivider, PageContainer } from "@/components/design-system";

export default function PrivacyLoading() {
  return (
    <div className="bg-cream py-16 md:py-20">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Privacyverklaring laden...
      </span>

      <PageContainer width="prose">
        {/* Header — kicker + title + last-updated + lead. */}
        <header
          aria-hidden="true"
          className="flex flex-col motion-safe:animate-pulse"
        >
          <div className="bg-paper-edge h-3 w-24" />
          <div className="bg-paper-edge mt-3 h-12 w-3/4" />
          <div className="bg-paper-edge mt-3.5 h-3 w-40" />
          <div className="mt-5 space-y-2">
            <div className="bg-paper-edge h-4 w-full" />
            <div className="bg-paper-edge h-4 w-5/6" />
          </div>
        </header>

        {/* Prose sections — H2 + paragraph bars between dotted dividers. */}
        <div aria-hidden="true" className="mt-10 motion-safe:animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <DottedDivider color="paper-edge" />
              <div className="my-7 space-y-3">
                <div className="bg-paper-edge h-6 w-1/2" />
                <div className="bg-paper-edge h-4 w-full" />
                <div className="bg-paper-edge h-4 w-11/12" />
                <div className="bg-paper-edge h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
