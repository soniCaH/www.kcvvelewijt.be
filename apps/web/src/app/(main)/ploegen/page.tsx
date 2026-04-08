import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { groupTeamsForLanding } from "@/lib/utils/group-teams";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/design-system/PageHero";
import { TeamFeaturedCard } from "@/components/teams/TeamFeaturedCard";
import { YouthTeamsDirectory } from "@/components/teams/YouthTeamsDirectory";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import { getPloegenSections } from "./getPloegenSections";

export const metadata: Metadata = {
  title: "Onze ploegen | KCVV Elewijt",
  description:
    "Alle ploegen van KCVV Elewijt: eerste ploeg, tweede ploeg en jeugd van U6 tot U21.",
};

async function fetchTeams() {
  try {
    return await runPromise(
      Effect.gen(function* () {
        const repo = yield* TeamRepository;
        return yield* repo.findAllForLanding();
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
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Ploegen", url: `${SITE_CONFIG.siteUrl}/ploegen` },
        ])}
      />
      <SectionStack
        sections={getPloegenSections({
          hero: aTeam ? (
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
              cta={{
                label: "Bekijk de A-ploeg",
                href: `/ploegen/${aTeam.slug}`,
              }}
            />
          ) : undefined,
          featured: bTeam ? (
            <TeamFeaturedCard team={bTeam} label="Tweede ploeg" />
          ) : undefined,
          youth: <YouthTeamsDirectory divisions={youthByDivision} />,
          cta: (
            <SectionCta
              heading="Aansluiten bij KCVV Elewijt?"
              body="Vanaf de allerkleinsten tot de eerste ploeg — iedereen is welkom op Sportpark Elewijt."
              buttonLabel="Meer info"
              buttonHref="/club/aansluiten"
            />
          ),
        })}
      />
    </>
  );
}

export const revalidate = 3600;
