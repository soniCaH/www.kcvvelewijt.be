import { Effect } from "effect";
import type { Metadata } from "next";
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
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { StripedSeam } from "@/components/design-system";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { JeugdHero } from "@/components/jeugd/JeugdHero/JeugdHero";
import { JeugdVisie } from "@/components/jeugd/JeugdVisie/JeugdVisie";
import { JeugdEditorialGrid } from "@/components/jeugd/JeugdEditorialGrid/JeugdEditorialGrid";
import { EditorialHubAnalytics } from "@/components/editorial/EditorialHubAnalytics/EditorialHubAnalytics";
import { JeugdCtaBand } from "@/components/jeugd/JeugdCtaBand/JeugdCtaBand";
import { YouthDirectory } from "@/components/team/YouthDirectory";

export const metadata: Metadata = {
  title: "Jeugdopleiding | KCVV Elewijt",
  description:
    "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
  openGraph: {
    title: "Jeugdopleiding | KCVV Elewijt",
    description:
      "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

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

      <div className="mx-auto w-full max-w-[70rem] px-4 py-10 sm:py-14">
        <JeugdHero />

        <div className="my-10 sm:my-12">
          <StripedSeam colorPair="ink-cream" height="md" />
        </div>

        <JeugdVisie />

        <EditorialHubAnalytics eventName="jeugd_card_click" className="mt-16">
          <JeugdEditorialGrid
            articles={articles}
            editorialConfig={editorialConfig}
          />
        </EditorialHubAnalytics>

        <YouthDirectory divisions={youthByDivision} className="mt-16" />
      </div>

      <JeugdCtaBand />
    </>
  );
}

export const revalidate = 3600;
