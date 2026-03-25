import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import {
  TeamRepository,
  type TeamNavVM,
} from "@/lib/repositories/team.repository";
import { TeamOverview, type TeamData } from "@/components/team/TeamOverview";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { JeugdHero } from "@/components/jeugd/JeugdHero/JeugdHero";
import { EditorialCard } from "@/components/club/EditorialCard/EditorialCard";

export const metadata: Metadata = {
  title: "Jeugdopleiding | KCVV Elewijt",
  description:
    "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
  openGraph: {
    title: "Jeugdopleiding | KCVV Elewijt",
    description:
      "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
    type: "website",
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
    href: `/team/${team.slug}`,
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

function EditorialSection() {
  return (
    <div className="max-w-[70rem] mx-auto px-4 md:px-10">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-label text-kcvv-gray mb-3">
          <span className="block w-5 h-0.5 bg-kcvv-green" />
          Ontdek onze jeugd
        </div>
        <h2 className="font-title font-extrabold text-kcvv-black text-3xl md:text-4xl uppercase leading-tight">
          Alles op één plek
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <EditorialCard
          href="/club/organigram"
          tag="Structuur"
          title="Organigram"
          description="Ontdek wie er achter de schermen van onze jeugdopleiding staat."
          arrowText="Bekijk"
          backgroundImage="/images/club/organigram.jpg"
        />
      </div>
    </div>
  );
}

export default async function JeugdPage() {
  const teams = await fetchYouthTeams();

  const heroSection: SectionConfig = {
    bg: "kcvv-black",
    content: <JeugdHero />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
    transition: {
      type: "diagonal",
      direction: "right",
      overlap: "full",
    },
    key: "hero",
  };

  const editorialSection: SectionConfig = {
    bg: "gray-100",
    content: <EditorialSection />,
    paddingTop: "pt-20",
    paddingBottom: "pb-20",
    transition: {
      type: "diagonal",
      direction: "left",
    },
    key: "editorial",
  };

  const teamsSection: SectionConfig = {
    bg: "kcvv-black",
    content: (
      <div className="max-w-[70rem] mx-auto px-4 md:px-10">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-label text-white/50 mb-3">
            <span className="block w-5 h-0.5 bg-kcvv-green" />
            Onze ploegen
          </div>
          <h2 className="font-title font-extrabold text-white text-3xl md:text-4xl uppercase leading-tight">
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
    paddingTop: "pt-20",
    paddingBottom: "pb-20",
    key: "teams",
  };

  return (
    <SectionStack sections={[heroSection, editorialSection, teamsSection]} />
  );
}

export const revalidate = 3600;
