/**
 * Team Detail Page
 * Displays individual team pages for all teams (senior and youth)
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG } from "@/lib/constants";
import { BffService } from "@/lib/effect/services/BffService";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import type { Match, RankingEntry } from "@kcvv/api-contract";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildSportsTeamJsonLd } from "@/lib/seo/jsonld";
import { TeamDetail } from "@/components/team/TeamDetail";
import { RelatedArticlesSection } from "@/components/related/RelatedArticlesSection";
import { type RoutablePlayerVM } from "@/lib/repositories/player.repository";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { transformMatchToSchedule, transformRankingToStandings } from "./utils";

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
        const repo = yield* TeamRepository;
        return yield* repo.findAll();
      }),
    );
    return teams
      .filter((team) => team.slug)
      .map((team) => ({ slug: team.slug }));
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
        const repo = yield* TeamRepository;
        return yield* repo.findBySlug(slug);
      }),
    );
    if (!team) return { title: "Team niet gevonden | KCVV Elewijt" };

    const typeLabel = team.teamType === "youth" ? "Jeugdploeg" : "Ploeg";
    const description = team.tagline
      ? `${team.name} - ${team.tagline}`
      : `${team.name} - KCVV Elewijt ${typeLabel}`;

    return {
      title: `${team.name} | KCVV Elewijt`,
      description,
      alternates: { canonical: `${SITE_CONFIG.siteUrl}/ploegen/${slug}` },
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
      const repo = yield* TeamRepository;
      return yield* repo.findBySlug(slug);
    }),
  );

  if (!team) notFound();

  const relatedArticles = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findRelated(team.id);
    }),
  );

  const psdTeamId = team.psdId ? parseInt(team.psdId, 10) : NaN;
  const bffData =
    Number.isFinite(psdTeamId) && psdTeamId > 0
      ? await fetchBffData(psdTeamId)
      : null;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Ploegen", url: `${SITE_CONFIG.siteUrl}/ploegen` },
          { name: team.name, url: `${SITE_CONFIG.siteUrl}/ploegen/${slug}` },
        ])}
      />
      <JsonLd
        data={buildSportsTeamJsonLd({
          name: team.name,
          url: `${SITE_CONFIG.siteUrl}/ploegen/${slug}`,
        })}
      />
      <TeamDetail
        header={{
          name: team.name,
          imageUrl: team.teamImageUrl ?? undefined,
          ageGroup: team.ageGroup,
          teamType: team.teamType,
          tagline: team.tagline,
        }}
        players={team.players.filter(
          (p): p is RoutablePlayerVM => p.href !== undefined,
        )}
        staff={team.staff}
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
        pageType="team"
        pageSlug={slug}
        className="max-w-4xl mx-auto px-4 pb-8"
      />
    </>
  );
}

export const revalidate = 3600;
