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

async function fetchBffData(
  footbelId: number | null,
  leagueId: number | null,
): Promise<BffData | null> {
  if (!footbelId) return null;

  const rankingId = leagueId ?? footbelId;

  try {
    const [matches, standings] = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        const [matchesResult, standingsResult] = yield* Effect.all(
          [
            bff
              .getMatches(footbelId)
              .pipe(
                Effect.catchAll(() => Effect.succeed([] as readonly Match[])),
              ),
            bff
              .getRanking(rankingId)
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
    return { matches, standings, teamId: footbelId };
  } catch {
    return null;
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params;

  const team = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getTeamBySlug(slug);
    }),
  ).catch(() => null);

  if (!team) notFound();

  const bffData = await fetchBffData(team.footbelId, team.leagueId);

  return (
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
    />
  );
}

export const revalidate = 3600;
