/**
 * Events list page (`/evenementen`).
 *
 * Renders the upcoming-only `EventRepository.findUpcomingForList()` feed — the
 * merge of `event` docs and `articleType:event` articles (#1968) — as a
 * single-column, month-grouped list of `<TicketStub>` with colour-coded filter
 * chips (#1965 + #1966) on a dark `jersey-deep-dark` field (design lock 6e §2).
 * Event-doc tickets link to `/evenementen/[slug]`, article tickets to
 * `/nieuws/[slug]` (the repo resolves each item's `href`). The `(main)` group
 * hosts both this list and the `/evenementen/[slug]` detail; `/events/*` 301s
 * here (see `next.config.ts`).
 *
 * The filter chips, empty / filtered-to-zero states, and analytics live in the
 * `<EventsBrowser>` client shell; this server page only fetches the feed.
 *
 * No `<Suspense>` boundary around `<EventsBrowser>` — it reads its active
 * facet from `window.location` on mount rather than `useSearchParams`
 * (#2564 review item 2), so this whole page stays server-rendered/prerendered
 * on this ISR route: the ticket list ships in the HTML, not a loading
 * skeleton thrown away at hydration.
 */

import { Effect } from "effect";

import { SITE_CONFIG } from "@/lib/constants";
import { runPromise } from "@/lib/effect/runtime";
import { orDieOrRenderOnDemand } from "@/lib/effect/or-die-or-render-on-demand";
import { EventRepository } from "@/lib/repositories/event.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageContainer } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { EventsBrowser } from "@/components/event/EventsBrowser";

// Exported so `loading.tsx` can reuse the real, unshimmered opening (#2432
// §2) instead of a second hand-typed copy that can silently drift from this
// one.
export const EVENEMENTEN_KICKER = "KCVV Elewijt · Agenda";
export const EVENEMENTEN_HEADLINE = "Evenementen";

export const metadata = buildPageMetadata({
  title: "Evenementen",
  description:
    "Alle aankomende evenementen van KCVV Elewijt — clubactiviteiten, jeugdevenementen en supportersuitjes.",
  path: "/evenementen",
  ogTitle: "Evenementen - KCVV Elewijt",
  ogDescription: "Alle aankomende evenementen van KCVV Elewijt",
  keywords: [
    "evenementen",
    "agenda",
    "activiteiten",
    "club",
    "jeugd",
    "KCVV Elewijt",
  ],
});

// 1h ISR — events listing; on-demand revalidation via /api/revalidate
// (revalidatePath '/evenementen') makes new/edited events appear sooner.
export const revalidate = 3600;

export default async function EvenementenPage() {
  // Subject read: the events feed is this page's entire content, so a
  // failed read takes the page down with it (#2864).
  const events = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      return yield* repo.findUpcomingForList();
    }).pipe(orDieOrRenderOnDemand),
  );

  return (
    <div className="bg-jersey-deep-dark flex min-h-screen flex-col">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Evenementen", url: `${SITE_CONFIG.siteUrl}/evenementen` },
        ])}
      />
      {/* The opening and the listing are ONE padded section, not two stacked on
          the same colour (#2479 rule 3) — the dark field runs from the kicker to
          the last ticket without an internal seam. */}
      <PageContainer as="main" width="index" className="flex-1 py-12 sm:py-16">
        <PageHero
          register="minimal"
          tone="dark"
          kicker={EVENEMENTEN_KICKER}
          headline={EVENEMENTEN_HEADLINE}
        />
        <EventsBrowser events={events} />
      </PageContainer>
    </div>
  );
}
