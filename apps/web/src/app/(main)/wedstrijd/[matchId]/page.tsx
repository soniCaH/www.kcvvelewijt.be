/**
 * Match Detail Page — Phase 6.B composition (6.B.d1 lock).
 *
 * Page shape (Variant A "shared shell, per-section auto-hide"):
 *
 *   MatchStripSlot                 ← top only, mirrors /spelers/[slug]
 *   <MatchHero>                    ← state-aware; never auto-hides
 *   <StripedSeam>                  ← only when a body section will render
 *   <MatchLineupSection>           ← auto-hides on empty (typically upcoming)
 *   <StripedSeam>                  ← only when both Lineup + Events render
 *   <MatchEventsSection>           ← auto-hides on empty
 *   [reserved: <MatchArticleLinkCard>]   ← deferred to post-#1470
 *   [reserved: <RelatedArticles>]        ← deferred to post-#1470
 *   <FooterSafeArea>
 *
 * Replaces the legacy `<MatchDetailView>` consumption (now orphaned;
 * retired by the #1913 cleanup ticket).
 *
 * Note: the legacy `backUrl` back-link feature (a MatchDetailView-only
 * affordance) has no slot in the new chrome and is intentionally not
 * carried over. Users navigate via browser back or the breadcrumb
 * (rendered as JSON-LD only — visual breadcrumb would be a separate
 * deliberate add).
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { BffService } from "@/lib/effect/services/BffService";
import { PlayerRepository } from "@/lib/repositories/player.repository";
import type { MatchDetail, MatchEvent } from "@kcvv/api-contract";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildSportsEventJsonLd,
} from "@/lib/seo/jsonld";
import { MatchHero } from "@/components/match/MatchHero";
import { MatchLineupSection } from "@/components/match/MatchLineupSection";
import { MatchEventsSection } from "@/components/match/MatchEventsSection";
import { FooterSafeArea, StripedSeam } from "@/components/design-system";
import { MatchStripSlot } from "@/components/layout/MatchStrip/MatchStripSlot";
import { PageViewTracker, TrackInView } from "@/components/analytics";
import {
  transformHomeTeam,
  transformAwayTeam,
  transformLineupPlayer,
  enrichLineupWithKeeperFlag,
  extractMatchTime,
  formatMatchTitle,
  formatMatchDescription,
} from "./utils";

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
}

/**
 * Build SEO metadata for a match page using the route `matchId`.
 *
 * Fetches match details for the given `params.matchId` and produces a metadata
 * object containing a page `title`; when match data is available, also adds
 * `description` and `openGraph` fields populated from the match.
 */
export async function generateMetadata({
  params,
}: MatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const numericId = parseInt(matchId, 10);

  if (isNaN(numericId)) {
    return {
      title: "Wedstrijd niet gevonden | KCVV Elewijt",
    };
  }

  try {
    const match = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatchDetail(numericId);
      }),
    );

    const title = formatMatchTitle(match);
    const description = formatMatchDescription(match);

    return {
      title: `${title} | KCVV Elewijt`,
      description,
      alternates: { canonical: `${SITE_CONFIG.siteUrl}/wedstrijd/${matchId}` },
      openGraph: {
        title,
        description,
        type: "website",
        images: [DEFAULT_OG_IMAGE],
      },
    };
  } catch {
    return {
      title: "Wedstrijd niet gevonden | KCVV Elewijt",
    };
  }
}

/**
 * Retrieve match details for the given match ID. Routes the BFF's tagged
 * `HttpNotFound` error to Next.js's `notFound()` so an unknown matchId
 * surfaces as a 404 page. Other BFF errors (5xx, parse failures, timeouts)
 * bubble up — Next's error boundary handles them, which is what we want
 * for service outages: don't silently disguise them as "not found".
 */
async function fetchMatchOrNotFound(matchId: number): Promise<MatchDetail> {
  return runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      return yield* bff.getMatchDetail(matchId);
    }).pipe(
      // `notFound()` throws Next's NEXT_NOT_FOUND sentinel; wrapping in
      // `Effect.sync` keeps the Effect chain consistent and lets TS narrow
      // the union (notFound returns `never`). Same pattern as the existing
      // `apps/web/src/app/sitemap.ts` HttpNotFound handler.
      Effect.catchTag("HttpNotFound", () => Effect.sync(() => notFound())),
    ),
  );
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  const numericId = parseInt(matchId, 10);

  if (isNaN(numericId)) {
    notFound();
  }

  const match = await fetchMatchOrNotFound(numericId);

  // Fetch keeper PSD ids from Sanity (cached for 24h in the repo's
  // module-scope memo + Sanity CDN — see PlayerRepository.findKeeperPsdIds).
  // Used to flag KCVV-side keepers; opponent side falls back to the
  // jersey-#1 heuristic. Returns `undefined` (not an empty Set) on Sanity
  // failure so `enrichLineupWithKeeperFlag` can detect lookup failure and
  // degrade BOTH sides to the jersey-#1 heuristic.
  const keeperPsdIds: ReadonlySet<string> | undefined = await runPromise(
    Effect.gen(function* () {
      const repo = yield* PlayerRepository;
      return yield* repo.findKeeperPsdIds();
    }).pipe(
      Effect.catchAllCause((cause) => {
        console.warn(
          "[wedstrijd/[matchId]] Sanity keeper lookup failed, " +
            "falling back to jersey-#1 heuristic on both sides.",
          { cause },
        );
        return Effect.succeed(undefined);
      }),
    ),
  );

  const homeTeam = transformHomeTeam(match);
  const awayTeam = transformAwayTeam(match);
  const time = extractMatchTime(match);

  // Resolve which side is KCVV from the BFF-supplied `is_home` flag. If
  // unset (legacy rows), enrichment falls back to the universal jersey-#1
  // heuristic for both sides.
  const kcvvSide: "home" | "away" | undefined =
    match.is_home === true
      ? "home"
      : match.is_home === false
        ? "away"
        : undefined;

  const homeLineup =
    match.lineup?.home
      .map(transformLineupPlayer)
      .map((p) =>
        enrichLineupWithKeeperFlag(p, "home", kcvvSide, keeperPsdIds),
      ) ?? [];
  const awayLineup =
    match.lineup?.away
      .map(transformLineupPlayer)
      .map((p) =>
        enrichLineupWithKeeperFlag(p, "away", kcvvSide, keeperPsdIds),
      ) ?? [];

  const events: readonly MatchEvent[] = match.events ?? [];
  const hasLineup = homeLineup.length > 0 || awayLineup.length > 0;
  const hasEvents = events.length > 0;

  const matchLabel = formatMatchTitle(match);

  const analyticsParams = {
    match_id: numericId,
    status: match.status,
  };

  return (
    <>
      <PageViewTracker eventName="match_detail_view" params={analyticsParams} />
      <h1 className="sr-only">{matchLabel}</h1>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Kalender", url: `${SITE_CONFIG.siteUrl}/kalender` },
          {
            name: matchLabel,
            url: `${SITE_CONFIG.siteUrl}/wedstrijd/${matchId}`,
          },
        ])}
      />
      <JsonLd
        data={buildSportsEventJsonLd({
          name: `${match.home_team.name} vs ${match.away_team.name}`,
          startDate: match.date.toISOString(),
          homeTeamName: match.home_team.name,
          awayTeamName: match.away_team.name,
          status: match.status,
          url: `${SITE_CONFIG.siteUrl}/wedstrijd/${matchId}`,
          venue: match.venue,
        })}
      />

      <MatchStripSlot />

      <MatchHero
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        date={match.date}
        time={time}
        venue={match.venue}
        status={match.status}
        competition={match.competition}
        kcvvTeamLabel={match.kcvv_team_label}
      />

      {(hasLineup || hasEvents) && (
        <StripedSeam colorPair="ink-cream" height="md" />
      )}

      {hasLineup && (
        <TrackInView
          eventName="match_lineup_section_in_view"
          params={analyticsParams}
        >
          <MatchLineupSection
            homeTeamName={match.home_team.name}
            awayTeamName={match.away_team.name}
            homeLineup={homeLineup}
            awayLineup={awayLineup}
          />
        </TrackInView>
      )}

      {hasLineup && hasEvents && (
        <StripedSeam colorPair="ink-cream" height="md" />
      )}

      {hasEvents && (
        <TrackInView
          eventName="match_events_section_in_view"
          params={analyticsParams}
        >
          <MatchEventsSection
            homeTeamName={match.home_team.name}
            awayTeamName={match.away_team.name}
            homeTeamLogo={match.home_team.logo}
            awayTeamLogo={match.away_team.logo}
            events={events}
          />
        </TrackInView>
      )}

      {/* TODO(#1470 follow-up): <MatchArticleLinkCard> renders here when a
          matchPreview/matchRecap article exists for this match. Slot
          reserved per the 6.B.d1 lock; component build deferred until the
          article schema's `linkedMatch` field lands. */}

      {/* TODO(#1470 follow-up): match-filtered <RelatedArticles> renders
          here. Same dependency on the `linkedMatch` field — query would
          return zero rows in v1, so the slot stays empty until #1470. */}

      <FooterSafeArea />
    </>
  );
}

/**
 * Enable ISR with 5 minute revalidation for match data
 * (shorter than team pages since match data changes more frequently).
 */
export const revalidate = 300;
