/**
 * Team Detail Page
 * Displays individual team pages for all teams (senior and youth)
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { BffService } from "@/lib/effect/services/BffService";
import type { Match, RankingEntry } from "@kcvv/api-contract";
import { TeamDetail } from "@/components/team/TeamDetail";
import { RelatedArticlesSection } from "@/components/related/RelatedArticlesSection";
import {
  transformSanityPlayerToRoster,
  transformSanityStaffToMember,
  getSanityTeamTagline,
  getSanityTeamType,
  getSanityAgeGroup,
  transformMatchToSchedule,
  transformRankingToStandings,
} from "./utils";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Produce static route parameters for all teams.
 *
 * @returns An array of route parameter objects with `slug` set to each team's slug; returns an empty array if teams cannot be fetched.
 */
export async function generateStaticParams() {
  try {
    const teams = await runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getTeams();
      }),
    );
    return teams.map((team) => ({ slug: team.slug.current }));
  } catch {
    return [];
  }
}

/**
 * Generate page metadata for a team identified by the route slug.
 *
 * @param params - A promise resolving to route parameters containing `slug`, used to fetch the team
 * @returns A Metadata object with `title`, `description`, and `openGraph` fields for the team; if the team cannot be found or an error occurs, a Metadata object with a not-found title is returned
 */
export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const team = await runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getTeamBySlug(slug);
      }),
    );
    if (!team) return { title: "Team niet gevonden | KCVV Elewijt" };

    const tagline = getSanityTeamTagline(team);
    const teamType = getSanityTeamType(team);
    const typeLabel = teamType === "youth" ? "Jeugdploeg" : "Ploeg";
    const description = tagline
      ? `${team.name} - ${tagline}`
      : `${team.name} - KCVV Elewijt ${typeLabel}`;

    return {
      title: `${team.name} | KCVV Elewijt`,
      description,
      openGraph: {
        title: team.name,
        description,
        type: "website",
        images: team.teamImageUrl
          ? [{ url: team.teamImageUrl, alt: `${team.name} teamfoto` }]
          : undefined,
      },
    };
  } catch {
    return { title: "Team niet gevonden | KCVV Elewijt" };
  }
}

interface BffData {
  matches: readonly Match[];
  standings: readonly RankingEntry[];
  teamId: number;
}

/**
 * Fetches matches and standings from the BFF for a given team.
 *
 * @param psdTeamId - The team's PSD internal ID (used for both matches and standings).
 * @returns An object with `matches`, `standings`, and `teamId` when successful; `null` on error.
 */
async function fetchBffData(psdTeamId: number): Promise<BffData | null> {
  try {
    const [matches, standings] = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        const [matchesResult, standingsResult] = yield* Effect.all(
          [
            bff
              .getMatches(psdTeamId)
              .pipe(
                Effect.catchAll(() => Effect.succeed([] as readonly Match[])),
              ),
            bff
              .getRanking(psdTeamId)
              .pipe(
                Effect.catchAll(() =>
                  Effect.succeed([] as readonly RankingEntry[]),
                ),
              ),
          ],
          { concurrency: "unbounded" },
        );
        return [matchesResult, standingsResult] as const;
      }),
    );
    return { matches, standings, teamId: psdTeamId };
  } catch {
    return null;
  }
}

/**
 * Renders the team detail page for the given team slug.
 *
 * Loads team and related BFF data and returns the TeamDetail element populated with the team's header, roster, staff, matches, and standings. Triggers a 404 when no team is found for the provided slug.
 *
 * @param props.params - An object whose `slug` identifies the team to render
 * @returns The TeamDetail React element for the specified team
 */
export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params;

  const team = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getTeamBySlug(slug);
    }),
  );

  if (!team) notFound();

  const relatedArticles = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getRelatedArticles(team._id);
    }),
  );

  const psdTeamId = parseInt(team.psdId, 10);
  const bffData =
    Number.isFinite(psdTeamId) && psdTeamId > 0
      ? await fetchBffData(psdTeamId)
      : null;

  return (
    <>
      <TeamDetail
        header={{
          name: team.name,
          imageUrl: team.teamImageUrl ?? undefined,
          ageGroup: getSanityAgeGroup(team),
          teamType: getSanityTeamType(team),
          tagline: getSanityTeamTagline(team),
        }}
        players={(team.players ?? []).map(transformSanityPlayerToRoster)}
        staff={(team.staff ?? []).map(transformSanityStaffToMember)}
        matches={bffData?.matches.map(transformMatchToSchedule) ?? []}
        standings={bffData?.standings.map(transformRankingToStandings) ?? []}
        highlightTeamId={bffData?.teamId}
        teamSlug={slug}
        calendarUrl={
          bffData ? `/api/calendar.ics?teamIds=${bffData.teamId}` : undefined
        }
      />

      <RelatedArticlesSection
        articles={relatedArticles}
        className="max-w-4xl mx-auto px-4 pb-8"
      />
    </>
  );
}

export const revalidate = 3600;
