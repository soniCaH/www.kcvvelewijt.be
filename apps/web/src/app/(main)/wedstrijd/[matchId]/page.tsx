/**
 * Match Detail Page — Phase 6.B composition (6.B.d1 lock).
 *
 * Page shape (Variant A "shared shell, per-section auto-hide"):
 *
 *   MatchStripSlot                 ← top only, mounted by ./layout.tsx (#3027)
 *   <MatchHero>                    ← state-aware; never auto-hides
 *   <StripedSeam>                  ← only when a body section will render
 *   <MatchLineupSection>           ← auto-hides on empty (typically upcoming)
 *   <StripedSeam>                  ← only when both Lineup + Events render
 *   <MatchEventsSection>           ← auto-hides on empty
 *   <StripedSeam>                  ← only before standings when a body section rendered
 *   <MatchStandingsSection>        ← league matches only; auto-hides on a
 *                                     genuinely empty ranking, renders a
 *                                     failure notice on a permanently-failed
 *                                     read instead (#2576)
 *   <StripedSeam>                  ← only before the row when a body section rendered
 *   <RelatedRow>                   ← one mixed, cross-type onward slot (#2443/#2581)
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
 * #2443 resolution retires `<MatchArticleLinkCard>` + `<GallerySection>`
 * (both deleted) and `selectMatchArticle`'s recap-vs-preview truth table:
 * the linked article(s), the KCVV team, the opponent (a new
 * `/tegenstander/[clubId]` link), and any linked galleries now all enter
 * `<RelatedRow>`'s domain tier as separate cards in one merged, ordered,
 * capped list instead of one hero card plus a secondary inline link.
 */

import { cache } from "react";
import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE, KCVV_CLUB_ID } from "@/lib/constants";
import { BffService } from "@/lib/effect/services/BffService";
import { PlayerRepository } from "@/lib/repositories/player.repository";
import {
  ArticleRepository,
  type MatchArticleVM,
} from "@/lib/repositories/article.repository";
import {
  TeamRepository,
  type TeamNavVM,
} from "@/lib/repositories/team.repository";
import {
  PhotoGalleryRepository,
  type GalleryCardVM,
} from "@/lib/repositories/photoGallery.repository";
import type {
  MatchDetail,
  MatchEvent,
  RankingEntry,
  RankingTable,
} from "@kcvv/api-contract";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildSportsEventJsonLd,
} from "@/lib/seo/jsonld";
import { MatchHero } from "@/components/match/MatchHero";
import { MatchLineupSection } from "@/components/match/MatchLineupSection";
import { MatchEventsSection } from "@/components/match/MatchEventsSection";
import { MatchStandingsSection } from "@/components/match/MatchStandingsSection";
import { PageContainer, StripedSeam, UpLink } from "@/components/design-system";
import { RelatedRow } from "@/components/related/RelatedRow";
import { mergeRelatedRow } from "@/components/related/mergeRelatedRow";
import type { RelatedRowItem } from "@/components/related/types";
import {
  matchArticlesToRelatedRow,
  mapGalleriesToRelatedRow,
} from "@/lib/utils/article-related-items";
import { PageViewTracker, TrackInView } from "@/components/analytics";
import {
  matchDetailToHeroRow,
  transformLineupPlayer,
  enrichLineupWithKeeperFlag,
  formatMatchTitle,
  formatMatchDescription,
} from "./utils";

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
}

// No static prerendering — the body fetches live PSD match data via the
// rate-limited BFF. Empty, but required: without this export the segment never
// enters the ISR cache and `revalidate` is inert (#2391).
export async function generateStaticParams() {
  return [];
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
      title: "Wedstrijd niet gevonden",
      // #2963/#2968: belt-and-braces. The same-segment `layout.tsx` now
      // gets a real 404 here, but this noindex stays in case a future
      // `loading.tsx`/ancestor boundary ever reintroduces the soft 200.
      robots: { index: false, follow: false },
    };
  }

  try {
    const match = await fetchMatchOrNotFound(numericId);

    const title = formatMatchTitle(match);
    const description = formatMatchDescription(match);

    return {
      title,
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
    // Also swallows the `notFound()` sentinel for an unknown matchId, which is
    // fine: the same-segment `layout.tsx` (#2968) awaits the same memoized
    // promise ahead of this metadata read and is what actually turns it into
    // the real 404 — this catch only needs a title to show while that
    // happens, not to re-derive the outcome.
    //
    // #2963: deliberately NOT noindex. This `catch` cannot tell an unknown
    // match from a BFF read failure — an unknown PSD id returns 200 with an
    // empty body and dies at `response.json()`, exactly like a transient
    // outage. Emitting noindex here would ask Google to drop live match
    // pages during an outage. Only the `isNaN` branch above, which can never
    // be a real match, carries it.
    return {
      title: "Wedstrijd niet gevonden",
    };
  }
}

/**
 * Retrieve match details for the given match ID. Routes the BFF's tagged
 * `HttpNotFound` error to Next.js's `notFound()` so an unknown matchId
 * surfaces as a 404 page. Other BFF errors (5xx, parse failures, timeouts)
 * bubble up — Next's error boundary handles them, which is what we want
 * for service outages: don't silently disguise them as "not found".
 *
 * Wrapped in React `cache()` so `generateMetadata` and the page component
 * share one read: they run in the same render pass with the same `matchId`,
 * and Next's `fetch` memoization cannot collapse them because
 * `@effect/platform` always attaches an `AbortSignal`, which opts the request
 * out of it (#2441). Per-render only — no TTL, see `BffServiceLive` (#2389).
 *
 * **Deliberately narrow (#2782)**, not converged onto `degradeIfPermanent`'s
 * three-tag split. Widening to also catch `ParseError`/`HttpApiDecodeError`
 * would call `notFound()` for those too — telling a visitor "this match does
 * not exist" about a real match this deploy simply failed to decode. Left to
 * reject, that same failure throws instead, and at this route's 5-minute ISR
 * window (`revalidate` below) a *cached* match keeps serving its last-good
 * render rather than a false 404 for the window. That fallback exists only
 * once the route has rendered successfully at least once, though — on a cold
 * render (first hit, or right after a redeploy) the same throw sends the
 * visitor straight to the error boundary; staying narrow is the better of
 * two imperfect outcomes here, not a free win.
 *
 * Confirmed while auditing this site: an empty-body HTTP 200 from
 * `/games/{id}/info` for an unknown `matchId` is converted to
 * `ResourceNotFoundError` → `HttpNotFound` by `fetchRawMatchDetail`'s
 * `emptyBodyIsNotFound` opt-in (`apps/api/src/psd/service.ts`, landed in
 * #2911) before it ever reaches this function — so the branch below is
 * genuinely reachable for a bogus `matchId`, not dead code shadowed by a
 * decode error arriving first.
 */
export const fetchMatchOrNotFound = cache(async function fetchMatchOrNotFound(
  matchId: number,
): Promise<MatchDetail> {
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
      // Every other BFF error is meant to bubble/reject unchanged (see this
      // function's own docblock) — `Effect.orDie` only makes that
      // pre-existing decision visible to the narrowed `runPromise` signature
      // (#2864), it does not change what rejects.
      Effect.orDie,
    ),
  );
});

/**
 * Match-day standings (#2162) — league matches only. A cup/friendly/other
 * match has no meaningful league table, so we gate on the BFF-surfaced
 * structured `competitionType` (never on string-matching the Dutch label) and
 * a resolved `kcvv_team_id`; anything else triggers no ranking fetch at all.
 *
 * Deliberately no bare `catchAll` on the ranking read (#2778) — see
 * `/ploegen/[slug]/page.tsx`'s `fetchBffData` docstring for the full
 * transient-throws / permanent-degrades rationale. This read classifies its
 * own three permanent tags by hand below rather than through the shared
 * `degradeIfPermanent` (`lib/effect/degrade-if-permanent.ts`, still
 * `/ploegen/[slug]`'s tool) — see the `fetchStandings` docblock for why
 * `HttpNotFound` needs different treatment here than the other two.
 *
 * This route's own facts: a 5-minute ISR window (below), and no cheaper
 * failure domain to isolate this one read into than the whole page. This
 * site has no PPR/streaming (root `CLAUDE.md`'s "Nothing streams" rule), so
 * every read in this render's single `Promise.all` (below) fails the whole
 * page the same way regardless of which one rejected — there is no partial-
 * render escape hatch that lets only `<MatchStandingsSection>` go down while
 * the hero and lineup still serve. A rejecting ranking read taking the route
 * down is therefore not a choice this function makes so much as this render
 * model's shape; the only alternative is catching it, which is the bug this
 * ticket fixes — trading a full-page throw (ISR keeps serving the last-good
 * page) for a successful-but-wrong render cached for the whole window.
 *
 * Owner call (#2778, revisited by #2576): a permanently-failed read no
 * longer collapses to the exact same outcome as "no ranking fetched at
 * all" — that was the gap #2778 deliberately left open ("no new copy for
 * this state… out of scope for #2778"). It now resolves to `null` instead
 * of `[]` for a genuine failure, so `<MatchStandingsSection>` can tell that
 * apart from a legitimately empty ranking and render a failure notice
 * instead of auto-hiding on both alike (#2576) — the same `null`-sentinel
 * idiom `/ploegen/[slug]/page.tsx`'s `fetchBffData` already uses for its own
 * ranking read. `null` rather than a string literal: `"unavailable"` shares
 * `length`/`indexOf`/`slice`/… with `readonly RankingEntry[]`, so a stray
 * `standingsResult.length` downstream would silently compile against the
 * sentinel instead of failing loudly.
 *
 * **A 404 is deliberately NOT one of the failures this degrades to
 * `null`.** `apps/api/src/handlers/ranking.ts` maps an *empty* upstream
 * table list to the exact same `HttpNotFound` a genuinely-unknown
 * `kcvv_team_id` would get — "no ranking published yet" and "no ranking
 * read at all" are indistinguishable at this boundary. Degrading a 404 to
 * the failure notice would show *"Het klassement is even niet
 * beschikbaar"* on every youth fixture for weeks before the association
 * publishes a table, which is exactly the silent case the AC protects.
 * `HttpNotFound` therefore degrades to `[]` — not applicable, the same as
 * the guards below — and the `null` sentinel is reserved for the failures
 * that genuinely mean "PSD sent something this deploy could not read"
 * (`ParseError`, `HttpApiDecodeError`). This is why this read cannot reuse
 * the shared `degradeIfPermanent` (`lib/effect/degrade-if-permanent.ts`,
 * still `/ploegen/[slug]`'s tool unchanged) — that helper treats all of
 * `PERMANENT_BFF_TAGS` alike, and this route needs `HttpNotFound` split out
 * from the other two.
 *
 * The BFF now hands back every official table this team plays in (#2631), so
 * pick the one holding **both** sides of this match — a fixture belongs to
 * exactly one phase. Flattening instead would double a club that appears in
 * an autumn and a spring poule.
 */
async function fetchStandings(
  match: MatchDetail,
): Promise<readonly RankingEntry[] | null> {
  // A pitch-reservation placeholder (#2606) carries no result vocabulary — a
  // standings table is exactly that, so it never fetches for one, even on
  // the defensive off-chance a reservation is ever miscategorised `league`
  // upstream. Not applicable, not a failure: nothing to read here.
  if (
    match.is_placeholder ||
    match.competitionType !== "league" ||
    match.kcvv_team_id == null
  ) {
    return [];
  }
  const standingsTeamId = match.kcvv_team_id;
  const tables = await runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      return yield* bff.getRanking(standingsTeamId);
    }).pipe(
      Effect.catchTags({
        HttpNotFound: () => Effect.succeed([] as readonly RankingTable[]),
        ParseError: (error) => warnAndDegradeRankingRead("ParseError", error),
        HttpApiDecodeError: (error) =>
          warnAndDegradeRankingRead("HttpApiDecodeError", error),
      }),
      // The remaining (transient) BFF errors are meant to bubble/reject
      // unchanged (see this function's own docblock) — `Effect.orDie` only
      // makes that pre-existing decision visible to the narrowed
      // `runPromise` signature (#2864), it does not change what rejects.
      Effect.orDie,
    ),
  );
  if (tables === null) return null;

  const holds = (table: RankingTable, clubId: number) =>
    table.entries.some((e) => e.club_id === clubId);

  // Prefer the table holding both sides; fall back to one holding either, so a
  // phase that has published only one of the two clubs still renders the row
  // it has — what a single-table team got before this change.
  //
  // Ceiling: when two phases share both clubs, feed order decides and the
  // autumn table can front a spring fixture. Resolving that needs the match to
  // carry its own competition id, which the contract does not surface yet —
  // it lands with the December phase work (#2589 decision 5).
  const table =
    tables.find(
      (t) => holds(t, match.home_team.id) && holds(t, match.away_team.id),
    ) ??
    tables.find(
      (t) => holds(t, match.home_team.id) || holds(t, match.away_team.id),
    );
  return table?.entries ?? [];
}

/** Shared warn-and-degrade for `fetchStandings`'s two genuine-failure tags —
 *  `ParseError`/`HttpApiDecodeError` mean this deploy cannot read what PSD
 *  sent, unlike `HttpNotFound` (handled inline above; see the docblock). */
function warnAndDegradeRankingRead(
  tag: "ParseError" | "HttpApiDecodeError",
  error: unknown,
) {
  console.warn(
    `[fetchStandings] "${tag}" classified as permanent; degrading instead of retrying.`,
    { error },
  );
  return Effect.succeed(null);
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  const numericId = parseInt(matchId, 10);

  if (isNaN(numericId)) {
    notFound();
  }

  const match = await fetchMatchOrNotFound(numericId);

  // These five depend only on `match` / `matchId` and never on each other, so
  // they run as one wave instead of five serialized round-trips — `max()`
  // latency rather than `sum()` (#2441). Each keeps its own fallback: none of
  // them is load-bearing enough to take the page down.
  const [keeperPsdIds, linkedArticles, galleries, standingsResult, allTeams] =
    await Promise.all([
      // Keeper PSD ids from Sanity (cached for 24h in the repo's module-scope
      // memo + Sanity CDN — see PlayerRepository.findKeeperPsdIds). Used to
      // flag KCVV-side keepers; opponent side falls back to the jersey-#1
      // heuristic. Returns `undefined` (not an empty Set) on Sanity failure so
      // `enrichLineupWithKeeperFlag` can detect lookup failure and degrade
      // BOTH sides to the jersey-#1 heuristic.
      runPromise(
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
      ),
      // The editorial article(s) linked to this match (#1914). Matches are
      // BFF/PSD-native, so the link is the article's `linkedMatch` string id —
      // the route `matchId` itself. Resilient: a Sanity outage degrades to "no
      // card" rather than 500-ing the whole match page.
      runPromise(
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
      ),
      // Photo galleries linked to this match (#1471). A match can have several
      // (warmup / match / viering); the repo returns them chronologically.
      // Resilient: a Sanity outage degrades to "no galleries".
      runPromise(
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
      ),
      fetchStandings(match),
      // Every one of KCVV's own teams (#2443 domain tier) — the established
      // `findAll()` workaround (`TeamRepository` has no `findByPsdId`,
      // matching `/tegenstander/[clubId]`'s own precedent) used below to
      // resolve the team that actually played this match via
      // `match.kcvv_team_id`. Resilient: a Sanity outage degrades to "no
      // KCVV team card".
      runPromise(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAll();
        }).pipe(
          Effect.catchAllCause((cause) => {
            console.warn(
              "[wedstrijd/[matchId]] team lookup failed; rendering without the RelatedRow team card.",
              { cause },
            );
            return Effect.succeed<TeamNavVM[]>([]);
          }),
        ),
      ),
    ]);

  // The fourth adapter's output (#2802 review) — `<MatchHero>` renders this
  // directly, and everything gated below it reads `heroRow.kind` rather
  // than re-deriving the reduced question from raw fields. A boolean
  // placeholder flag alone used to let a tournament fixture through every
  // one of these gates, shipping a two-competitor `SportsEvent` and a real
  // lineup/events section under a one-crest hero that names no confirmed
  // opponent.
  const heroRow = matchDetailToHeroRow(match);
  const isReduced = heroRow.kind !== "match";

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
  // Neither a pitch-reservation placeholder nor a tournament fixture with no
  // result yet shows a lineup, events, or result vocabulary (#2606/#2802
  // review) — a self-match carries none of these upstream, and an
  // unconfirmed tournament opponent has nothing genuinely tied to *this*
  // fixture either. The guard is explicit rather than incidental so a stray
  // BFF anomaly can't leak a lineup onto a reduced page.
  const hasLineup =
    !isReduced && (homeLineup.length > 0 || awayLineup.length > 0);
  const hasEvents = !isReduced && events.length > 0;

  // `null` (a permanently-failed ranking read, #2576) renders a failure
  // notice rather than auto-hiding, so the section mounts for that case too
  // even though there is no table to show either way.
  const hasStandings = standingsResult === null || standingsResult.length > 0;

  const matchLabel = formatMatchTitle(match);

  // Domain tier (#2443 rule 4) — every relation here is bounded (at most a
  // handful of cards) and defining (they say what THIS match is/was, not
  // what it did): the article(s) written about it, the KCVV squad that
  // played it, the opponent, and any linked galleries.
  const kcvvTeam = allTeams.find(
    (t) => t.psdId !== null && Number(t.psdId) === match.kcvv_team_id,
  );
  const kcvvTeamItems: RelatedRowItem[] = kcvvTeam
    ? [
        {
          title: kcvvTeam.displayName,
          href: `/ploegen/${kcvvTeam.slug}`,
          imageUrl: kcvvTeam.teamImageUrl ?? undefined,
          artefact: kcvvTeam.teamImageUrl
            ? undefined
            : { kind: "team" as const },
          badge: "PLOEG",
          analyticsId: kcvvTeam.id,
          analyticsSource: "domain",
          analyticsType: "team",
          analyticsTargetSlug: kcvvTeam.slug,
        },
      ]
    : [];

  // The opponent card links to `/tegenstander/[clubId]` — an internal page,
  // not a Sanity document (opponent clubs have none). No card on a
  // pitch-reservation placeholder (#2606, both sides share KCVV's own club
  // id) — "the opponent" is meaningless there. `/tegenstander/[clubId]`
  // only ever queries the senior "A" team's opponent history and 404s
  // (rather than rendering an empty history) when that team has never
  // played the given club, so the card is additionally gated to a senior
  // league fixture (review round 1, #2788) — a youth or cup match would
  // otherwise link straight into a hard 404 on a noindex, off-nav page.
  const isSeniorLeagueFixture =
    match.competitionType === "league" && kcvvTeam?.age === "A";
  const opponentClub =
    isSeniorLeagueFixture &&
    !match.is_placeholder &&
    match.home_team.id !== match.away_team.id
      ? match.home_team.id === KCVV_CLUB_ID
        ? match.away_team
        : match.away_team.id === KCVV_CLUB_ID
          ? match.home_team
          : null
      : null;
  const opponentItems: RelatedRowItem[] = opponentClub
    ? [
        {
          title: opponentClub.name,
          href: `/tegenstander/${opponentClub.id}`,
          imageUrl: opponentClub.logo,
          // `opponentClub.logo` is truthy on the `imageUrl` branch above, so
          // this artefact fallback only ever runs when it's falsy — no
          // `logoUrl` to forward (review round 1, #2788); `<Crest>` falls
          // back to an initialled disc.
          artefact: opponentClub.logo
            ? undefined
            : { kind: "club" as const, name: opponentClub.name },
          badge: "TEGENSTANDER",
          analyticsId: String(opponentClub.id),
          analyticsSource: "domain",
          analyticsType: "team",
          analyticsTargetSlug: String(opponentClub.id),
        },
      ]
    : [];

  const relatedRowItems = mergeRelatedRow({
    domain: [
      ...matchArticlesToRelatedRow(linkedArticles),
      ...kcvvTeamItems,
      ...opponentItems,
      ...mapGalleriesToRelatedRow(galleries),
    ],
    curated: [],
    reference: [],
    semantic: [],
    siblings: [],
  });
  const hasRelated = relatedRowItems.length > 0;

  const analyticsParams = {
    match_id: numericId,
    status: match.status,
  };

  return (
    <>
      <PageViewTracker eventName="match_detail_view" params={analyticsParams} />
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
      {/* No SportsEvent JSON-LD for a pitch-reservation placeholder or a
          tournament fixture with no result yet (#2606/#2696/#2802 review) —
          a self-match is a pitch booking, not a sporting event between two
          competitors, and an unconfirmed tournament opponent is the same
          class of unconfirmed claim, so publishing either here would assert
          a real fixture to search engines that the page's own <h1> and
          <title> deliberately don't. The breadcrumb above still applies —
          it names this page, not a match. */}
      {!isReduced && (
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
      )}

      <PageContainer className="pb-12 lg:pb-16">
        <UpLink href="/kalender" label="Kalender" className="mb-6" />
        <MatchHero match={heroRow} />
      </PageContainer>

      {(hasLineup || hasEvents || hasStandings || hasRelated) && (
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

      {/* Match-day standings (#2162) — league matches only. `<TrackInView>`
          wraps only the table-rendered branch: `match_standings_in_view`
          means "a standings table was shown", so it must not fire on the
          auto-hide (cup/friendly/off-season) branch NOR on the failure-
          notice branch, which mounts the section but never a table
          (#2576 review finding 3). */}
      {standingsResult === null ? (
        <MatchStandingsSection
          unavailable
          homeClubId={match.home_team.id}
          awayClubId={match.away_team.id}
          highlightTeamId={match.kcvv_team_id}
        />
      ) : (
        hasStandings && (
          <TrackInView
            eventName="match_standings_in_view"
            params={analyticsParams}
          >
            <MatchStandingsSection
              entries={standingsResult}
              homeClubId={match.home_team.id}
              awayClubId={match.away_team.id}
              highlightTeamId={match.kcvv_team_id}
            />
          </TrackInView>
        )
      )}

      {/* Seam before the row when a body section preceded it, so it isn't
          flush against the lineup/events/standings block. */}
      {hasRelated && (hasLineup || hasEvents || hasStandings) && (
        <StripedSeam colorPair="ink-cream" height="md" />
      )}

      {/* One mixed, cross-type onward-navigation slot (#2443/#2581) —
          replaces <MatchArticleLinkCard> + <GallerySection>. Domain tier:
          the linked article(s), the KCVV team, the opponent, and any linked
          galleries. Auto-hides on empty. */}
      <RelatedRow items={relatedRowItems} pageType="match" pageSlug={matchId} />
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
