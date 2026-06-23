/**
 * Team listing — Phase 6.C rebuild.
 *
 * Editorial page-header → A-ploeg flagship (jersey-deep) → B-ploeg flagship
 * (cream, mirrored) → youth directory (Bovenbouw / Middenbouw / Onderbouw) →
 * footer. Replaces the legacy InteriorPageHero + TeamFeaturedCard +
 * YouthTeamsDirectory composition (those components retire in #1947).
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { groupTeamsForLanding } from "@/lib/utils/group-teams";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageViewTracker } from "@/components/analytics";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { PageContainer } from "@/components/design-system/PageContainer";
import { TeamFlagship } from "@/components/team/TeamFlagship";
import { YouthDirectory } from "@/components/team/YouthDirectory";

const PLOEGEN_TITLE = "Onze ploegen | KCVV Elewijt";
const PLOEGEN_DESCRIPTION =
  "Alle ploegen van KCVV Elewijt: eerste ploeg, tweede ploeg en jeugd van U6 tot U21.";

export const metadata = buildPageMetadata({
  title: PLOEGEN_TITLE,
  description: PLOEGEN_DESCRIPTION,
  path: "/ploegen",
});

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
      <PageViewTracker eventName="team_list_view" />

      <PageContainer width="index" className="py-10 sm:py-14">
        {/* Page header */}
        <header className="mb-10 flex flex-col gap-3">
          <span>
            <MonoLabel variant="plain">KCVV Elewijt</MonoLabel>
          </span>
          <EditorialHeading
            level={1}
            size="display-2xl"
            emphasis={{ text: "." }}
          >
            Onze ploegen
          </EditorialHeading>
          <p className="font-display text-ink-muted text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic">
            Van de eerste ploeg tot de allerkleinsten — één plezante compagnie.
          </p>
        </header>

        {/* A + B paired flagships (larger gap between the siblings) */}
        <div className="flex flex-col gap-10 sm:gap-16">
          {aTeam ? (
            <TeamFlagship
              variant="a"
              kicker="Eerste elftal"
              category="A-ploeg"
              division={aTeam.divisionFull ?? aTeam.division}
              season={aTeam.season}
              teamImageUrl={aTeam.teamImageUrl}
              href={`/ploegen/${aTeam.slug}`}
            />
          ) : null}

          {bTeam ? (
            <TeamFlagship
              variant="b"
              kicker="Tweede elftal"
              category="B-ploeg"
              division={bTeam.divisionFull ?? bTeam.division}
              season={bTeam.season}
              teamImageUrl={bTeam.teamImageUrl}
              href={`/ploegen/${bTeam.slug}`}
            />
          ) : null}
        </div>

        <YouthDirectory divisions={youthByDivision} className="mt-16" />
      </PageContainer>
    </>
  );
}

export const revalidate = 3600;
