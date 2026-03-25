import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { groupTeamsForLanding } from "@/lib/utils/group-teams";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/design-system/PageHero";
import { TeamFeaturedCard } from "@/components/teams/TeamFeaturedCard";
import { YouthTeamsDirectory } from "@/components/teams/YouthTeamsDirectory";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";

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
          content: (
            <PageHero
              image={aTeam.teamImageUrl ?? "/images/hero-club.jpg"}
              imageAlt={`Team foto ${aTeam.name}`}
              label="Eerste ploeg"
              headline={(() => {
                const parts = aTeam.name.split(/\s+/);
                if (parts.length >= 2) {
                  return (
                    <>
                      {parts[0]}
                      <br />
                      <span className="text-kcvv-green">{parts[1]}</span>
                      {parts.length > 2 ? ` ${parts.slice(2).join(" ")}` : ""}
                    </>
                  );
                }
                return aTeam.name;
              })()}
              body={aTeam.divisionFull ?? ""}
              cta={{ label: "Bekijk de A-ploeg", href: `/team/${aTeam.slug}` }}
            />
          ),
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
          bg: "gray-100",
          paddingTop: "pt-16",
          paddingBottom: "pb-16",
          content: (
            <SectionCta
              heading="Aansluiten bij KCVV Elewijt?"
              body="Vanaf de allerkleinsten tot de eerste ploeg — iedereen is welkom op Sportpark Elewijt."
              buttonLabel="Meer info"
              buttonHref="/club/aansluiten"
            />
          ),
        },
      ]}
    />
  );
}

export const revalidate = 3600;
