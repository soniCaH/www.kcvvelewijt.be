/**
 * Youth Teams Overview Page
 * Displays all youth teams in a grid layout grouped by age category
 */

import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import {
  TeamRepository,
  type TeamNavVM,
} from "@/lib/repositories/team.repository";
import { TeamOverview, type TeamData } from "@/components/team/TeamOverview";

export const metadata: Metadata = {
  title: "Jeugdploegen | KCVV Elewijt",
  description:
    "Ontdek alle jeugdploegen van KCVV Elewijt. Van U6 tot U21, onze jeugdopleiding begeleidt jonge talenten naar hun volle potentieel.",
  openGraph: {
    title: "Jeugdploegen | KCVV Elewijt",
    description:
      "Ontdek alle jeugdploegen van KCVV Elewijt. Van U6 tot U21, onze jeugdopleiding begeleidt jonge talenten naar hun volle potentieel.",
    type: "website",
  },
};

/**
 * Convert a TeamNavVM into a TeamData object suitable for the TeamOverview component.
 *
 * @param team - The team nav view model to transform.
 * @returns A `TeamData` object, or `null` if the team has no U-age group or no slug.
 */
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

/**
 * Retrieve youth teams and convert them into data objects for the UI.
 */
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

/**
 * Render the youth teams overview page
 */
export default async function JeugdPage() {
  const teams = await fetchYouthTeams();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-title">
          Jeugdploegen
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          KCVV Elewijt investeert volop in de jeugdopleiding. Onze gediplomeerde
          trainers begeleiden jonge voetballers van U6 tot U21 met aandacht voor
          plezier, techniek en teamspirit.
        </p>
      </header>

      {/* Teams Grid */}
      <TeamOverview
        teams={teams}
        teamType="youth"
        groupByAge={true}
        variant="grid"
        emptyMessage="Er zijn momenteel geen jeugdploegen beschikbaar."
      />
    </div>
  );
}

/**
 * Enable ISR with 1 hour revalidation
 */
export const revalidate = 3600;
