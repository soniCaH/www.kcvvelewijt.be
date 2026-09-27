/**
 * Team listing — Phase 6.C rebuild.
 *
 * Editorial page-header → A-ploeg flagship (jersey-deep) → B-ploeg flagship
 * (cream, mirrored) → the directory of everything those two leave out
 * (Reserven / Bovenbouw / Middenbouw / Onderbouw) → footer. Replaces the legacy
 * InteriorPageHero + TeamFeaturedCard + YouthTeamsDirectory composition (those
 * components retire in #1947).
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { groupTeamsForLanding } from "@/lib/utils/group-teams";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageViewTracker } from "@/components/analytics";
import { PageContainer } from "@/components/design-system/PageContainer";
import { PageHero } from "@/components/layout/PageHero";
import { TeamFlagship } from "@/components/team/TeamFlagship";
import { YouthDirectory } from "@/components/team/YouthDirectory";
import { PLOEGEN_TITLE, PLOEGEN_KICKER, PLOEGEN_LEAD } from "./copy";

// Names the reserves too: the page lists them, and leaving them out of the
// description is the same mis-filing the section heading below used to make.
const PLOEGEN_DESCRIPTION =
  "Alle ploegen van KCVV Elewijt: eerste ploeg, tweede ploeg, reserven en jeugd van U6 tot U21.";

export const metadata = buildPageMetadata({
  title: PLOEGEN_TITLE,
  description: PLOEGEN_DESCRIPTION,
  path: "/ploegen",
});

async function fetchTeams() {
  // The outer try/catch is not the dead-catchAll anti-pattern this ticket
  // removes elsewhere: it covers `AppLayer` construction failing (e.g. a
  // missing `KCVV_API_URL`), which happens outside the effect
  // `degradeSection`'s `catchAllCause` wraps — an in-effect catch cannot see
  // a failure to provide the effect's own context (#2864, same mechanism as
  // `app/layout.tsx`'s nav-teams read).
  try {
    return await runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAllForLanding();
        }),
        [],
        "[ploegen] failed to fetch teams",
      ),
    );
  } catch (error) {
    console.error("[ploegen] failed to fetch teams:", error);
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

      <PageContainer width="index" className="py-12 sm:py-16">
        <PageHero
          register="minimal"
          kicker={PLOEGEN_KICKER}
          headline={PLOEGEN_TITLE}
          lead={PLOEGEN_LEAD}
        />

        {/* A + B paired flagships (larger gap between the siblings) */}
        <div className="flex flex-col gap-10 sm:gap-16">
          {aTeam ? (
            <TeamFlagship
              variant="a"
              kicker="Eerste elftal"
              category={aTeam.displayName}
              division={aTeam.divisionFull ?? aTeam.division}
              teamImageUrl={aTeam.teamImageUrl}
              href={`/ploegen/${aTeam.slug}`}
            />
          ) : null}

          {bTeam ? (
            <TeamFlagship
              variant="b"
              kicker="Tweede elftal"
              category={bTeam.displayName}
              division={bTeam.divisionFull ?? bTeam.division}
              teamImageUrl={bTeam.teamImageUrl}
              href={`/ploegen/${bTeam.slug}`}
            />
          ) : null}
        </div>

        <YouthDirectory
          heading="Andere"
          divisions={youthByDivision}
          className="mt-16"
        />
      </PageContainer>
    </>
  );
}

export const revalidate = 3600;
