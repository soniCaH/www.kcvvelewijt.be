/**
 * Youth Teams Overview Page
 * Displays all youth teams in a grid layout grouped by age category
 */

import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import type { SanityTeam } from "@/lib/effect/services/SanityService";
import { TeamOverview, type TeamData } from "@/components/team/TeamOverview";
import {
  getSanityAgeGroup,
  getSanityTeamTagline,
} from "@/app/(main)/team/[slug]/utils";

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
 * Convert a Sanity team object into a TeamData object suitable for the TeamOverview component.
 *
 * @param team - The Sanity team object to transform.
 * @returns A `TeamData` object with id, name, href, ageGroup, teamType, and tagline, or `null` if the team's age group cannot be determined or `slug.current` is missing.
 */
function transformTeamToData(team: SanityTeam): TeamData | null {
  const ageGroup = getSanityAgeGroup(team);

  // Only include youth teams with a valid slug
  if (!ageGroup || !team.slug?.current) return null;

  return {
    id: team._id,
    name: team.name,
    href: `/team/${team.slug.current}`,
    ageGroup,
    teamType: "youth",
    tagline: getSanityTeamTagline(team),
  };
}

/**
 * Retrieve youth teams from Sanity and convert them into data objects for the UI.
 *
 * Fetches teams from the Sanity service, transforms valid entries into `TeamData`,
 * and excludes invalid or incomplete teams.
 *
 * @returns An array of `TeamData` objects for valid youth teams; an empty array if fetching fails or no valid teams are found.
 */
async function fetchYouthTeams(): Promise<TeamData[]> {
  try {
    const teams = await runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getTeams();
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
