/**
 * Team Detail Page — Phase 6.C single-scroll composition.
 *
 * SiteHeader → MatchStripSlot → TeamHero → sticky section-nav →
 * StandingsTable → TeamMatchesSection → SquadGrid → TeamStaff →
 * TeamEditorial → RelatedArticles → global SponsorsBlock → footer.
 * <StripedSeam> separates sections; every non-hero section auto-hides on
 * empty data (a U6 page degrades to hero + squad + staff).
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { BffService } from "@/lib/effect/services/BffService";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import type { Match, RankingEntry } from "@kcvv/api-contract";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildSportsTeamJsonLd } from "@/lib/seo/jsonld";
import { PageViewTracker, TrackInView } from "@/components/analytics";
import { MatchStripSlot } from "@/components/layout/MatchStrip";
import { StripedSeam } from "@/components/design-system/StripedSeam";
import { FooterSafeArea } from "@/components/design-system";
import { TeamHero } from "@/components/team/TeamHero";
import { StandingsTable } from "@/components/team/StandingsTable";
import { TeamMatchesSection } from "@/components/team/TeamMatchesSection";
import { SquadGrid } from "@/components/team/SquadGrid";
import { TeamStaff } from "@/components/team/TeamStaff";
import { TeamEditorial } from "@/components/team/TeamEditorial";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { RelatedArticlesSection } from "@/components/related/RelatedArticlesSection";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { hasRenderableBioContent } from "@/lib/portable-text/findPullquoteText";
import { transformMatchToSchedule } from "./utils";
import { TeamSectionNav, type TeamSectionNavItem } from "./TeamSectionNav";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

// No static prerendering — the body fetches PSD data via the rate-limited BFF.
// Pages are built on-demand and ISR-cached (revalidate below).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
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
        : [DEFAULT_OG_IMAGE],
    },
  };
}

interface BffData {
  matches: readonly Match[];
  standings: readonly RankingEntry[];
  teamId: number;
}

async function fetchBffData(psdTeamId: number): Promise<BffData | null> {
  try {
    const [matches, standings] = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* Effect.all(
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
      }),
    );
    return { matches, standings, teamId: psdTeamId };
  } catch {
    return null;
  }
}

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

  const standings = bffData?.standings ?? [];
  const scheduleMatches = (bffData?.matches ?? []).map(
    transformMatchToSchedule,
  );
  const staff = team.staff.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    functionTitle: s.functionTitle,
    role: s.role,
    imageUrl: s.imageUrl,
  }));

  const teamBody = team.body as PortableTextBlock[] | null;
  const teamContact = team.contactInfo as PortableTextBlock[] | null;

  // Section render flags — keep the sticky nav in sync with each section's
  // own auto-hide so the nav never lists a section that doesn't render.
  const showStandings = standings.length > 0;
  const showMatches = scheduleMatches.length > 0;
  const showSquad = team.players.length > 0;
  const showStaff = staff.length > 0;
  const showEditorial =
    (teamBody !== null && hasRenderableBioContent(teamBody)) ||
    (team.trainingSchedule?.length ?? 0) > 0 ||
    (teamContact !== null && hasRenderableBioContent(teamContact));

  const navItems: TeamSectionNavItem[] = [
    showStandings && { id: "klassement", label: "Klassement" },
    showMatches && { id: "wedstrijden", label: "Wedstrijden" },
    showSquad && { id: "spelers", label: "Spelers" },
    showStaff && { id: "staf", label: "Staf" },
    showEditorial && { id: "info", label: "Info" },
  ].filter((x): x is TeamSectionNavItem => x !== false);

  const analyticsParams = { team_slug: slug };
  const sectionClass = "mx-auto w-full max-w-5xl scroll-mt-16 px-4 py-10";

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
      <PageViewTracker eventName="team_detail_view" params={analyticsParams} />

      <MatchStripSlot />

      <TeamHero
        name={team.name}
        age={team.age}
        teamType={team.teamType}
        ageGroup={team.ageGroup}
        division={team.division}
        divisionFull={team.divisionFull}
        season={team.season}
        tagline={team.tagline}
        teamImageUrl={team.teamImageUrl}
        className="mx-auto max-w-5xl px-4 py-8 sm:py-12"
      />

      <TeamSectionNav items={navItems} />

      {showStandings ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <TrackInView
            eventName="team_standings_in_view"
            params={analyticsParams}
          >
            <section id="klassement" className={sectionClass}>
              <StandingsTable
                entries={standings}
                highlightTeamId={bffData?.teamId}
              />
            </section>
          </TrackInView>
        </>
      ) : null}

      {showMatches ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <TrackInView
            eventName="team_matches_in_view"
            params={analyticsParams}
          >
            <section id="wedstrijden" className={sectionClass}>
              <TeamMatchesSection
                matches={scheduleMatches}
                teamSlug={slug}
                kcvvTeamId={bffData?.teamId}
              />
            </section>
          </TrackInView>
        </>
      ) : null}

      {showSquad ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <TrackInView eventName="team_squad_in_view" params={analyticsParams}>
            <section id="spelers" className={sectionClass}>
              <SquadGrid players={team.players} />
            </section>
          </TrackInView>
        </>
      ) : null}

      {showStaff ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <section id="staf" className={sectionClass}>
            <TeamStaff staff={staff} />
          </section>
        </>
      ) : null}

      {showEditorial ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <section id="info" className={sectionClass}>
            <TeamEditorial
              body={teamBody}
              trainingSchedule={team.trainingSchedule}
              contactInfo={teamContact}
            />
          </section>
        </>
      ) : null}

      <RelatedArticlesSection
        articles={relatedArticles}
        pageType="team"
        pageSlug={slug}
        className="mx-auto max-w-4xl px-4 pt-10 pb-8"
      />

      <SponsorsSection />
      <FooterSafeArea />
    </>
  );
}

export const revalidate = 3600;
