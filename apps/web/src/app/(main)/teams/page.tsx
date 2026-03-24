import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { groupTeamsForLanding } from "@/lib/utils/group-teams";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { TeamsHero } from "@/components/teams/TeamsHero";
import { TeamFeaturedCard } from "@/components/teams/TeamFeaturedCard";
import { YouthTeamsDirectory } from "@/components/teams/YouthTeamsDirectory";
import { TeamsCta } from "@/components/teams/TeamsCta";

export const metadata: Metadata = {
  title: "Onze ploegen | KCVV Elewijt",
  description:
    "Alle ploegen van KCVV Elewijt: eerste ploeg, tweede ploeg en jeugd van U6 tot U21.",
};

async function fetchTeams() {
  try {
    return await runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getTeamsLanding();
      }),
    );
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return [];
  }
}

export default async function TeamsPage() {
  const teams = await fetchTeams();
  const { aTeam, bTeam, youthByDivision } = groupTeamsForLanding(teams);

  return (
    <SectionStack
      sections={[
        aTeam && {
          bg: "kcvv-black",
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
          content: <TeamsHero team={aTeam} />,
          transition: {
            type: "diagonal" as const,
            direction: "right" as const,
          },
        },
        bTeam && {
          bg: "gray-100",
          paddingTop: "pt-20",
          paddingBottom: "pb-20",
          content: <TeamFeaturedCard team={bTeam} label="Tweede ploeg" />,
          transition: { type: "diagonal" as const, direction: "left" as const },
        },
        {
          bg: "kcvv-green-dark",
          paddingTop: "pt-20",
          paddingBottom: "pb-20",
          content: <YouthTeamsDirectory divisions={youthByDivision} />,
          transition: {
            type: "diagonal" as const,
            direction: "right" as const,
          },
        },
        {
          bg: "kcvv-black",
          paddingTop: "pt-16",
          paddingBottom: "pb-16",
          content: <TeamsCta />,
        },
      ]}
    />
  );
}

export const revalidate = 3600;
