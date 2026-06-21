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
 *   <StripedSeam>                  ← only before the card when a body section rendered
 *   <MatchArticleLinkCard>         ← auto-hides; the matchPreview/matchRecap article
 *                                    linked to this match, in a <TrackInView> (#1914)
 *
 * Replaces the legacy `<MatchDetailView>` consumption (now orphaned;
 * retired by the #1913 cleanup ticket).
 *
 * Note: the legacy `backUrl` back-link feature (a MatchDetailView-only
 * affordance) has no slot in the new chrome and is intentionally not
 * carried over. Users navigate via browser back or the breadcrumb
 * (rendered as JSON-LD only — visual breadcrumb would be a separate
 * deliberate add).
 *
 * Note: the match-filtered `<RelatedArticles>` slot reserved at the 6.B.d1
 * lock is not a separate section — a match has at most one *other* linked
 * article (the non-dominant preview/recap), so it's surfaced as the card's
 * inline `secondary` "Lees ook …" link instead (owner decision, #1914).
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { BffService } from "@/lib/effect/services/BffService";
import { PlayerRepository } from "@/lib/repositories/player.repository";
import {
  ArticleRepository,
  type MatchArticleVM,
} from "@/lib/repositories/article.repository";
import {
  PhotoGalleryRepository,
  type GalleryCardVM,
} from "@/lib/repositories/photoGallery.repository";
import type { MatchDetail, MatchEvent, RankingEntry } from "@kcvv/api-contract";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildSportsEventJsonLd,
} from "@/lib/seo/jsonld";
import { MatchHero } from "@/components/match/MatchHero";
import { MatchLineupSection } from "@/components/match/MatchLineupSection";
import { MatchEventsSection } from "@/components/match/MatchEventsSection";
import { MatchStandingsSection } from "@/components/match/MatchStandingsSection";
import {
  MatchArticleLinkCard,
  selectMatchArticle,
} from "@/components/match/MatchArticleLinkCard";
import { StripedSeam } from "@/components/design-system";
import { GallerySection } from "@/components/gallery/GallerySection/GallerySection";
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

  // Fetch the editorial article(s) linked to this match (#1914). Matches are
  // BFF/PSD-native, so the link is the article's `linkedMatch` string id — the
  // route `matchId` itself. `selectMatchArticle` applies the per-state truth
  // table to pick the hero article + (optional) inline secondary link.
  // Resilient: a Sanity outage degrades to "no card" rather than 500-ing the
  // whole match page, mirroring the keeper-lookup fallback above.
  const linkedArticles = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findByLinkedMatch(matchId);
    }).pipe(
      Effect.catchAllCause((cause) => {
        console.warn(
          "[wedstrijd/[matchId]] linked-article lookup failed; " +
            "rendering without the article link card.",
          { cause },
        );
        return Effect.succeed<MatchArticleVM[]>([]);
      }),
    ),
  );
  const articleSelection = selectMatchArticle(linkedArticles, match.status);
  const hasArticle = articleSelection !== null;

  // Photo galleries linked to this match (#1471). A match can have several
  // (warmup / match / viering); the repo returns them chronologically. Resilient:
  // a Sanity outage degrades to "no galleries" rather than 500-ing the page.
  const galleries: GalleryCardVM[] = await runPromise(
    Effect.gen(function* () {
      const repo = yield* PhotoGalleryRepository;
      return yield* repo.findByLinkedMatch(matchId);
    }).pipe(
      Effect.catchAllCause((cause) => {
        console.warn(
          "[wedstrijd/[matchId]] gallery lookup failed; rendering without galleries.",
          { cause },
        );
        return Effect.succeed<GalleryCardVM[]>([]);
      }),
    ),
  );
  const hasGallery = galleries.length > 0;

  // Match-day standings (#2162) — league matches only. A cup/friendly/other
  // match has no meaningful league table, so we gate on the BFF-surfaced
  // structured `competitionType` (never on string-matching the Dutch label) and
  // a resolved `kcvv_team_id`; anything else triggers no ranking fetch at all.
  // Resilient: a BFF failure degrades to an empty table (auto-hidden), never a
  // 500 — mirrors the `/ploegen/[slug]` standings fetch.
  let standings: readonly RankingEntry[] = [];
  if (match.competitionType === "league" && match.kcvv_team_id != null) {
    const standingsTeamId = match.kcvv_team_id;
    standings = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff
          .getRanking(standingsTeamId)
          .pipe(
            Effect.catchAll(() =>
              Effect.succeed([] as readonly RankingEntry[]),
            ),
          );
      }),
    );
  }
  const hasStandings = standings.length > 0;

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

      {(hasLineup || hasEvents || hasStandings || hasArticle || hasGallery) && (
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

      {/* Seam before the standings when a body section preceded it. */}
      {hasStandings && (hasLineup || hasEvents) && (
        <StripedSeam colorPair="ink-cream" height="md" />
      )}

      {/* Match-day standings (#2162) — league matches only; <TrackInView> only
          mounts when the section renders, so `match_standings_in_view` never
          fires on the auto-hide (cup/friendly/off-season) branch. */}
      {hasStandings && (
        <TrackInView
          eventName="match_standings_in_view"
          params={analyticsParams}
        >
          <MatchStandingsSection
            entries={standings}
            homeClubId={match.home_team.id}
            awayClubId={match.away_team.id}
            highlightTeamId={match.kcvv_team_id}
          />
        </TrackInView>
      )}

      {/* Seam before the article card when a body section preceded it, so the
          card isn't flush against the lineup/events/standings block. */}
      {hasArticle && (hasLineup || hasEvents || hasStandings) && (
        <StripedSeam colorPair="ink-cream" height="md" />
      )}

      {/* <MatchArticleLinkCard> (6.B.d4 lock) — the matchPreview/matchRecap
          article written about this match. `articleSelection` is precomputed
          server-side; <TrackInView> only mounts when the card will render, so
          `match_article_link_card_in_view` never fires on the auto-hide branch
          (Phase 6.A pattern). The truth-table pick (recap vs preview + the
          optional inline "Lees ook …" secondary) lives in `selectMatchArticle`.

          The match-filtered <RelatedArticles> slot reserved in 6.B.d1 is
          intentionally NOT a separate section: a match has at most one *other*
          linked article (the non-dominant preview/recap), so it's surfaced as
          the card's inline `secondary` link instead (owner decision, #1914). */}
      {articleSelection && (
        <TrackInView
          eventName="match_article_link_card_in_view"
          params={analyticsParams}
        >
          <MatchArticleLinkCard
            article={articleSelection.article}
            kicker={articleSelection.kicker}
            secondary={
              articleSelection.secondary
                ? {
                    slug: articleSelection.secondary.article.slug,
                    label: articleSelection.secondary.label,
                  }
                : null
            }
          />
        </TrackInView>
      )}

      {/* Photo galleries linked to this match (#1471). Seam only when a body
          section preceded it; <GallerySection> auto-hides on empty. */}
      {hasGallery && (hasLineup || hasEvents || hasStandings || hasArticle) && (
        <StripedSeam colorPair="ink-cream" height="md" />
      )}
      <GallerySection galleries={galleries} kicker="KCVV Elewijt · Beelden" />
    </>
  );
}

/**
 * ISR at 5 minutes. Kept modest (not lengthened like the other routes) so the
 * page picks up fresh BFF match data promptly. Proximity-aware throttling of
 * the rate-limited PSD hop lives in the BFF's match-detail KV TTL
 * (`apps/api` `matchDetailTtl`): distant/finished matches are served from KV
 * for hours/days, so frequent ISR here is cheap. The page's own Sanity reads
 * (linked articles/galleries) are tag-cached (Scope B), so re-running this
 * render does not re-hit the Sanity CDN.
 */
export const revalidate = 300;
