/**
 * `/inhoud` — the printed contents page (#2622, decision D8 in
 * `docs/research/decision-sheet.md` §8).
 *
 * One route that lists everything the site holds, so a visitor can see the
 * whole of it without guessing at navigation: ploegen with their reeks,
 * nieuws and evenementen with their dates, and the editorial clubpagina's.
 *
 * **Nothing here is authored.** Every row comes from a repository read, so a
 * deleted document leaves the page on the next revalidation and a new one
 * arrives the same way. That is the single invariant this route protects, and
 * it is protected because the hand-written twin of this page — `llms.txt` —
 * shipped `/club/organigram` for months after the route was removed.
 *
 * **No spelers.** An index of ~300 youth players was rejected on privacy
 * grounds (A7) and is unbuildable regardless: 0 of 294 player documents carry
 * a slug, so there is nothing to link to.
 *
 * **Dutch path.** `/inhoud`, not `/index` — every route on this site is Dutch,
 * and `index` is additionally the default document name a web server returns
 * for a directory.
 *
 * The route is reachable from the footer only. The nav is flat and stays flat
 * (#2409 / #2415).
 */

import { Effect } from "effect";

import { SiteContents } from "@/components/club/SiteContents/SiteContents";
import { SiteContentsAnalytics } from "@/components/club/SiteContents/SiteContentsAnalytics";
import { PageViewTracker } from "@/components/analytics";
import { PageContainer } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/constants";
import { degradeSection } from "@/lib/effect/degrade";
import { runPromise } from "@/lib/effect/runtime";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import { EventRepository } from "@/lib/repositories/event.repository";
import { PageRepository } from "@/lib/repositories/page.repository";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildSiteContents } from "@/lib/utils/site-contents";

const INHOUD_TITLE = "Inhoud";
const INHOUD_DESCRIPTION =
  "Alles wat op deze site staat, op één pagina: elke ploeg, elk nieuwsbericht, elk evenement en elke clubpagina.";

export const metadata = buildPageMetadata({
  title: INHOUD_TITLE,
  description: INHOUD_DESCRIPTION,
  path: "/inhoud",
  keywords: ["inhoud", "overzicht", "sitemap", "index", "KCVV Elewijt"],
});

/**
 * `findPaginated` rather than `findAll`: the paginated projection is the light
 * one (id, title, slug, date), where `findAll` also pulls every article's full
 * Portable Text body — a megabyte of prose to print 125 titles. The ceiling is
 * a slice bound, not a design limit; production holds 125 articles.
 */
const ARTICLE_ROW_CEILING = 1000;

/**
 * Each group is a *section* of the contents page, so a failed read degrades to
 * an absent group and keeps the other three (#2433 rule 3). `degradeSection`
 * and not `Effect.catchAll`: a Sanity read's typed `SanityReadError` (#2864)
 * is only half the failure surface `catchAll` would need to see — a stray
 * defect elsewhere in the same `Effect.gen` would still slip past it, where
 * `degradeSection`'s `catchAllCause` catches both.
 */
async function fetchSiteContents() {
  return runPromise(
    Effect.gen(function* () {
      const teamRepo = yield* TeamRepository;
      const articleRepo = yield* ArticleRepository;
      const eventRepo = yield* EventRepository;
      const pageRepo = yield* PageRepository;

      return yield* Effect.all(
        {
          teams: degradeSection(
            teamRepo.findAll(),
            [],
            "[inhoud] teams unavailable — group omitted",
          ),
          articles: degradeSection(
            articleRepo.findPaginated({
              offset: 0,
              limit: ARTICLE_ROW_CEILING,
            }),
            [],
            "[inhoud] articles unavailable — group omitted",
          ),
          // `findAll` is date-gated to upcoming events, and stays that way:
          // `/evenementen` and the sitemap gate identically, so lifting it
          // here would make `/inhoud` the only surface on the site that
          // publishes past events. The decision sheet budgeted 80 rows off the
          // raw document count; production holds 81 event documents of which
          // 77 carry no slug, so at most 4 were ever linkable.
          events: degradeSection(
            eventRepo.findAll(),
            [],
            "[inhoud] events unavailable — group omitted",
          ),
          pages: degradeSection(
            pageRepo.findAll(),
            [],
            "[inhoud] club pages unavailable — group omitted",
          ),
        },
        // Four independent Sanity reads. `Effect.all` is sequential by
        // default, which would make each revalidation four round trips deep
        // for no reason — `/kalender` runs its two the same way.
        { concurrency: "unbounded" },
      );
    }),
  );
}

export default async function InhoudPage() {
  const groups = buildSiteContents(await fetchSiteContents());

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: INHOUD_TITLE, url: `${SITE_CONFIG.siteUrl}/inhoud` },
        ])}
      />
      <PageViewTracker eventName="inhoud_view" />

      {/* No `as="main"`: the root layout already owns the `<main>` landmark. */}
      <PageContainer width="index" className="py-12 sm:py-16">
        <PageHero
          register="minimal"
          kicker="KCVV Elewijt · Overzicht"
          headline={INHOUD_TITLE}
          lead="Elke ploeg, elk artikel, elk evenement en elke clubpagina — automatisch bijgewerkt."
        />

        <SiteContentsAnalytics>
          <SiteContents groups={groups} />
        </SiteContentsAnalytics>
      </PageContainer>
    </>
  );
}

export const revalidate = 3600;
