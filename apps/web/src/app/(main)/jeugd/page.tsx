import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import {
  TeamRepository,
  type TeamNavVM,
} from "@/lib/repositories/team.repository";
import {
  ArticleRepository,
  type ArticleVM,
} from "@/lib/repositories/article.repository";
import {
  JeugdLandingPageRepository,
  JeugdLandingPageRepositoryLive,
  type EditorialCardConfig,
} from "@/lib/repositories/jeugd-landing-page.repository";
import { TeamOverview, type TeamData } from "@/components/team/TeamOverview";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { JeugdEditorialGrid } from "@/components/jeugd/JeugdEditorialGrid/JeugdEditorialGrid";
import { MissionBanner } from "@/components/club/MissionBanner/MissionBanner";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import { getJeugdSections } from "./getJeugdSections";

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

function transformTeamToData(team: TeamNavVM): TeamData | null {
  if (!team.age) return null;
  const match = team.age.match(/U\d{1,2}[A-Z]?/i);
  const ageGroup = match ? match[0].toUpperCase() : null;

  if (!ageGroup || !team.slug) return null;

  return {
    id: team.id,
    name: team.name,
    href: `/ploegen/${team.slug}`,
    ageGroup,
    teamType: "youth",
    tagline: team.tagline ?? team.divisionFull ?? team.division ?? undefined,
  };
}

async function fetchYouthTeams(): Promise<TeamData[]> {
  try {
    const teams = await runPromise(
      Effect.gen(function* () {
        const repo = yield* TeamRepository;
        return yield* repo.findAll();
      }),
    );

    return teams
      .map(transformTeamToData)
      .filter((team): team is TeamData => team !== null);
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

export default async function JeugdPage() {
  const [teams, articles, editorialConfig] = await Promise.all([
    fetchYouthTeams(),
    fetchJeugdArticles(),
    fetchEditorialConfig(),
  ]);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Jeugd", url: `${SITE_CONFIG.siteUrl}/jeugd` },
        ])}
      />
      <SectionStack
        sections={getJeugdSections({
          editorial: (
            <JeugdEditorialGrid
              articles={articles}
              editorialConfig={editorialConfig}
            />
          ),
          teams: (
            <div className="mx-auto max-w-[70rem] px-4 md:px-10">
              <div className="mb-10">
                <div className="tracking-label mb-3 flex items-center gap-2 text-[0.6875rem] font-extrabold text-white/50 uppercase">
                  <span className="bg-kcvv-green block h-0.5 w-5" />
                  Onze ploegen
                </div>
                <h2 className="font-title text-3xl leading-tight font-extrabold text-white uppercase md:text-4xl">
                  Van U6 tot U21
                </h2>
              </div>
              <TeamOverview
                teams={teams}
                teamType="youth"
                groupByAge={true}
                variant="grid"
                colorScheme="dark"
                emptyMessage="Er zijn momenteel geen jeugdploegen beschikbaar."
              />
            </div>
          ),
          quote: (
            <MissionBanner
              quote="Bij KCVV Elewijt staat plezier op één. We geloven dat spelplezier de beste basis is voor sportieve groei."
              attribution="— Jeugdopleiding KCVV Elewijt"
            />
          ),
          cta: (
            <SectionCta
              heading="Interesse in onze jeugd?"
              body="Nieuwe spelers zijn altijd welkom — van U6 tot U21."
              buttonLabel="Word ook lid"
              buttonHref="/club/inschrijven"
            />
          ),
        })}
      />
    </>
  );
}

export const revalidate = 3600;
