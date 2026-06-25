import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { TeamRepository } from "@/lib/repositories/team.repository";
import {
  ArticleRepository,
  type ArticleVM,
} from "@/lib/repositories/article.repository";
import {
  JeugdLandingPageRepository,
  JeugdLandingPageRepositoryLive,
  type EditorialCardConfig,
} from "@/lib/repositories/jeugd-landing-page.repository";
import {
  groupTeamsForLanding,
  type TeamLandingItem,
} from "@/lib/utils/group-teams";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageContainer, StripedSeam } from "@/components/design-system";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { JeugdHero } from "@/components/jeugd/JeugdHero/JeugdHero";
import { JeugdVisie } from "@/components/jeugd/JeugdVisie/JeugdVisie";
import { JeugdEditorialGrid } from "@/components/jeugd/JeugdEditorialGrid/JeugdEditorialGrid";
import { EditorialHubAnalytics } from "@/components/editorial/EditorialHubAnalytics/EditorialHubAnalytics";
import { JeugdCtaBand } from "@/components/jeugd/JeugdCtaBand/JeugdCtaBand";
import { YouthDirectory } from "@/components/team/YouthDirectory";

export const metadata = buildPageMetadata({
  title: "Jeugdopleiding",
  description:
    "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
  path: "/jeugd",
});

async function fetchTeams(): Promise<TeamLandingItem[]> {
  try {
    return await runPromise(
      Effect.gen(function* () {
        const repo = yield* TeamRepository;
        return yield* repo.findAllForLanding();
      }),
    );
  } catch (error) {
    console.error("Failed to fetch youth teams:", error);
    return [];
  }
}

async function fetchJeugdArticles(): Promise<ArticleVM[]> {
  try {
    return await runPromise(
      Effect.gen(function* () {
        const repo = yield* ArticleRepository;
        return yield* repo.findPaginated({
          offset: 0,
          limit: 3,
          category: "Jeugd",
        });
      }),
    );
  } catch (error) {
    console.error("Failed to fetch jeugd articles:", error);
    return [];
  }
}

async function fetchEditorialConfig(): Promise<EditorialCardConfig[] | null> {
  return runPromise(
    Effect.gen(function* () {
      const repo = yield* JeugdLandingPageRepository;
      return yield* repo.getEditorialCards();
    }).pipe(Effect.provide(JeugdLandingPageRepositoryLive)),
  );
}

/**
 * `/jeugd` — Phase 7 redesign (PRD redesign-phase-7-jeugd). The route renders
 * on the cream vocabulary: `<JeugdHero>` (photo) → `<StripedSeam>` →
 * `<JeugdVisie>` (the `#visie` filosofie block) → the `<JeugdEditorialGrid>`
 * nav hub → the 6.C `<YouthDirectory>` division grid → the full-bleed
 * `<JeugdCtaBand>`. Empty states: no youth teams → `<YouthDirectory>` drops the
 * section (returns null); no Jeugd articles → the nav hub collapses to its
 * pinned nav cards. Fires `jeugd_view` (page view) + `jeugd_card_click` (nav-hub
 * card clicks, via `<EditorialHubAnalytics>` delegation).
 */
export default async function JeugdPage() {
  const [teams, articles, editorialConfig] = await Promise.all([
    fetchTeams(),
    fetchJeugdArticles(),
    fetchEditorialConfig(),
  ]);

  const { youthByDivision } = groupTeamsForLanding(teams);

  return (
    <>
      <PageViewTracker eventName="jeugd_view" />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Jeugd", url: `${SITE_CONFIG.siteUrl}/jeugd` },
        ])}
      />

      <PageContainer width="index" className="pt-10 sm:pt-14">
        <JeugdHero />
      </PageContainer>

      {/* Full-bleed seam — a sibling of the container (not wrapped) so it spans
          the viewport like the seams elsewhere on the site. */}
      <div className="my-10 sm:my-12">
        <StripedSeam colorPair="ink-cream" height="md" />
      </div>

      <PageContainer width="index" className="pb-10 sm:pb-14">
        <JeugdVisie />

        <EditorialHubAnalytics eventName="jeugd_card_click" className="mt-16">
          <JeugdEditorialGrid
            articles={articles}
            editorialConfig={editorialConfig}
          />
        </EditorialHubAnalytics>

        <YouthDirectory divisions={youthByDivision} className="mt-16" />
      </PageContainer>

      <JeugdCtaBand />
    </>
  );
}

export const revalidate = 3600;
