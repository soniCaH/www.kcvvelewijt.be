/**
 * Privacy Policy Page — Loading Skeleton.
 *
 * Mirrors `PrivacyPage` (`/privacy`): the 8p1 cream-minimal composition — no
 * hero band. A prose header (mono kicker + display title + mono last-updated +
 * Freight lead) over a single prose column whose H2 sections are separated by
 * `<DottedDivider>` rules. The "last updated" line is a real timestamp — data
 * — so the whole header renders as bars rather than mixing real and shimmered
 * text.
 *
 * Prose width (680). Canonical paper-register chrome — `paper-edge` pulse bars
 * via `<Skeleton>`, dotted ink dividers; no cards (the page is a flat reading
 * column).
 */

import {
  DottedDivider,
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";

const PrivacyLoading = () => {
  return (
    <div className="bg-cream py-12 sm:py-16">
      <LoadingAnnouncement label="Privacyverklaring laden…" />

      <PageContainer width="prose">
        {/* Header — kicker + title + last-updated + lead. */}
        <header aria-hidden="true" className="flex flex-col">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-12 w-3/4" />
          <Skeleton className="mt-3.5 h-3 w-40" />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </header>

        {/* Prose sections — H2 + paragraph bars between dotted dividers. */}
        <div aria-hidden="true" className="mt-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <DottedDivider color="paper-edge" />
              <div className="my-7 space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
};

export default PrivacyLoading;
