/**
 * Events List Page — Loading Skeleton.
 *
 * Mirrors `EvenementenPage` (`/evenementen`):
 *   the shared opening's quiet register on the dark field (mono kicker +
 *   display headline — fixed copy), sharing one padded section with
 *     → <EventsBrowserSkeleton>: single-line filter chip row (matching
 *       <FilterTabs>, #2564) above a single-column, month-grouped
 *       `<TicketStub>` list (each month: display heading + ticket rows)
 *
 * The opening's kicker/headline are fixed copy, not data, so per #2432 §2
 * this reuses the real `<PageHero>` unshimmered.
 *
 * Index width (1280) on the dark field. The filter-row + ticket-list skeleton
 * is shared with the local `<Suspense>` fallback in `page.tsx` — see
 * `EventsBrowserSkeleton`.
 */

import { PageContainer, LoadingAnnouncement } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { EventsBrowserSkeleton } from "@/components/event/EventsBrowser";
import { EVENEMENTEN_KICKER, EVENEMENTEN_HEADLINE } from "./page";

export default function EvenementenLoading() {
  return (
    <div className="bg-jersey-deep-dark flex min-h-screen flex-col">
      <LoadingAnnouncement label="Evenementen laden…" />

      {/* The opening and the listing are one padded section, as on the page. */}
      <PageContainer width="index" className="flex-1 py-12 sm:py-16">
        <PageHero
          register="minimal"
          tone="dark"
          kicker={EVENEMENTEN_KICKER}
          headline={EVENEMENTEN_HEADLINE}
        />

        <EventsBrowserSkeleton />
      </PageContainer>
    </div>
  );
}
