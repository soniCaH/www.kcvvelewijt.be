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
 */

import { Effect } from "effect";

import { SITE_CONFIG } from "@/lib/constants";
import { runPromise } from "@/lib/effect/runtime";
import { EventRepository } from "@/lib/repositories/event.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import {
  EditorialHeading,
  MonoLabel,
  PageContainer,
} from "@/components/design-system";
import { EventsBrowser } from "@/components/event/EventsBrowser";

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
  const events = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      return yield* repo.findUpcomingForList();
    }),
  );

  return (
    <div className="bg-jersey-deep-dark flex min-h-screen flex-col">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Evenementen", url: `${SITE_CONFIG.siteUrl}/evenementen` },
        ])}
      />
      <PageContainer as="header" width="index" className="pt-12 pb-8">
        <MonoLabel tone="cream">KCVV Elewijt · Agenda</MonoLabel>
        <EditorialHeading
          level={1}
          size="display-xl"
          tone="cream"
          className="mt-2"
        >
          Evenementen
        </EditorialHeading>
      </PageContainer>

      <PageContainer as="main" width="index" className="flex-1 pb-16">
        <EventsBrowser events={events} />
      </PageContainer>
    </div>
  );
}
