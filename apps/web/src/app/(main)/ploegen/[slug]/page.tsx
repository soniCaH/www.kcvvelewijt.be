/**
 * Team Detail Page — Phase 6.C single-scroll composition.
 *
 * SiteHeader → MatchStripSlot → TeamHero → sticky section-nav →
 * [competitive block: status line, or (StandingsSection | failure notice) +
 * TeamMatchesSection] → SquadGrid → TeamStaff → TeamEditorial → global
 * SponsorsBlock → RelatedRow → footer.
 * <StripedSeam> separates sections; every non-hero section auto-hides on
 * empty data (a U6 page degrades to hero + squad + staff).
 *
 * #2443 resolution reorders the last two sections: `SponsorsSection` now
 * renders BEFORE `RelatedRow` (previously last) — the team page's last word
 * was a sponsor logo wall, not an onward-navigation slot.
 *
 * The competitive block (`#klassement` + `#wedstrijden`) does not auto-hide
 * per section any more — it is gated as ONE unit by
 * `isCompetitiveBlockOpen(deriveCompetitiveBlockState(...))` (#2636, split
 * further in #2795): either the block is closed and a single status line
 * takes both sections' place, or it is open and `#wedstrijden` renders in
 * full — with `#klassement` itself rendering `<StandingsSection>` UNLESS the
 * ranking read alone failed permanently, in which case it renders a failure
 * notice with no heading/id/nav-chip instead. See the comment beside
 * `competitiveState` below.
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { BffService } from "@/lib/effect/services/BffService";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import type { Match, RankingTable } from "@kcvv/api-contract";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildSportsTeamJsonLd } from "@/lib/seo/jsonld";
import { PageViewTracker, TrackInView } from "@/components/analytics";
import { MatchStripSlot } from "@/components/layout/MatchStrip";
import { getTeamMatches } from "@/lib/server/match-data";
import { isPermanentBffFailure } from "@/lib/effect/classify-bff-failure";
import { degradeIfPermanent } from "@/lib/effect/degrade-if-permanent";
import { StripedSeam } from "@/components/design-system/StripedSeam";
import { PageContainer } from "@/components/design-system/PageContainer";
import { UpLink } from "@/components/design-system/UpLink";
import { EmptyState } from "@/components/design-system/EmptyState";
import { TeamHero } from "@/components/team/TeamHero";
import { StandingsSection } from "@/components/team/StandingsSection";
import { TeamMatchesSection } from "@/components/team/TeamMatchesSection";
// Deep import, not the `TeamMatchesSection` barrel: that barrel also
// re-exports a `"use client"` component, and this is a server-side read of a
// plain predicate — no reason to route it through that boundary (#2636
// finding 11).
import { hasVisibleMatches } from "@/components/team/TeamMatchesSection/match-visibility";
import { CompetitiveStatusLine } from "@/components/team/CompetitiveStatusLine";
import { SquadGrid } from "@/components/team/SquadGrid";
import { TeamEnrolmentCta } from "@/components/team/TeamEnrolmentCta";
import { TeamStaff } from "@/components/team/TeamStaff";
import { TeamEditorial } from "@/components/team/TeamEditorial";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { RelatedRow } from "@/components/related/RelatedRow";
import { mergeRelatedRow } from "@/components/related/mergeRelatedRow";
import { articleVMsToRelatedRowItems } from "@/lib/utils/article-related-items";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { hasRenderableBioContent } from "@/lib/portable-text/findPullquoteText";
import { transformMatchToSchedule } from "@/components/match";
import {
  deriveCompetitiveBlockState,
  competitiveBlockHeadingLabel,
  isCompetitiveBlockOpen,
} from "@/lib/utils/competitive-block-state";
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
  if (!team) return { title: "Team niet gevonden" };

  // Tab, share card and heading all read the one resolved name, so a visitor is
  // never shown three names for one team (#2630).
  const displayName = team.displayName;
  const typeLabel = team.teamType === "youth" ? "Jeugdploeg" : "Ploeg";
  // The division moved here from the tagline. Deleting `computeTagline`'s
  // fallback was about the *hero*, where the mono pill already showed it — a
  // search result has no pill, so dropping it there too would degrade three
  // senior descriptions to a bare page type for no gain (#2630).
  const subtitle = team.tagline ?? team.divisionFull ?? team.division;
  const description = subtitle
    ? `${displayName} - ${subtitle}`
    : `${displayName} - KCVV Elewijt ${typeLabel}`;

  return {
    title: displayName,
    description,
    alternates: { canonical: `${SITE_CONFIG.siteUrl}/ploegen/${slug}` },
    openGraph: {
      title: displayName,
      description,
      type: "website",
      images: team.teamImageUrl
        ? [{ url: team.teamImageUrl, alt: `${displayName} teamfoto` }]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

interface BffData {
  matches: readonly Match[];
  // Nullable (#2795): `null` means the ranking read failed *permanently* —
  // specifically a `ParseError`/`HttpApiDecodeError`, a response this
  // deploy can no longer decode — while the fixtures read fulfilled. A value
  // `deriveCompetitiveBlockState` reads into `ranking-unavailable`, never
  // `no-table`. A genuine "no table published yet" (including the BFF's own
  // 404 for that case — see `fetchBffData`'s docblock) is the fulfilled
  // value `[]`, not `null`.
  standings: readonly RankingTable[] | null;
  teamId: number;
}

/**
 * Deliberately no plain `catch`/`catchAll` on either read (#2540 state 4 /
 * #2636 AC 4). A caught BFF failure would *succeed* — the empty render it
 * produces gets written into the 15-minute ISR cache like any other, so an
 * upstream blip on a Sunday afternoon would silently delete the league table
 * at peak traffic and keep saying "the season hasn't started" for the whole
 * window. Left to reject, the same failure makes this render throw, so ISR
 * serves the last-good page instead — up to 15 min stale, recovering
 * silently at the next successful regeneration.
 *
 * That is the right shape for a *transient* failure. It is the wrong shape
 * for a *permanent* one (#2636 finding 3): `generateStaticParams` returns
 * `[]`, so a team whose `psdId` is stale/mistyped in Sanity, or whose feed
 * this deploy can no longer decode, never once succeeds — there is no
 * last-good page for ISR to fall back to, ever, so every request throws and
 * the route serves `error.tsx` forever instead of the hero/squad/staff a
 * broken competitive block should still degrade to.
 *
 * The two reads are told apart differently (#2636 finding 2, review round 2),
 * and now **resolve differently too** (#2795): a permanent failure on the
 * fixtures read still collapses the whole competitive block (there is no
 * fixture data left to prove the team is even in competition), but a
 * permanent failure on the ranking read alone must not throw away a
 * `matchesResult` that fulfilled — `#wedstrijden` still has data to render.
 *
 * - The **ranking** read still has its typed `BffError` channel here, so a
 *   permanent tag is caught *as an Effect* via the shared `degradeIfPermanent`
 *   (`lib/effect/degrade-if-permanent.ts`, extracted in #2778 once
 *   `/wedstrijd/[matchId]` needed the identical split), exhaustiveness-checked
 *   against the union. A caught read resolves to `null` (a value, not a
 *   rejection) rather than the empty array a transient failure would be
 *   indistinguishable from. That `null` now flows all the way to `BffData`
 *   as `standings: null` — it is no longer collapsed to the `"unavailable"`
 *   sentinel, so the fixtures already in hand are never discarded.
 *
 *   **`HttpNotFound` is resolved to `[]` before it ever reaches
 *   `degradeIfPermanent`** (#2795 review round). `apps/api/src/handlers/
 *   ranking.ts` maps an *empty* upstream table list to the exact same 404 a
 *   genuinely-unknown PSD team id would get — the handler's own
 *   `tables.length === 0` guard and `apps/api/src/psd/service.ts`'s
 *   `classifyHttpError` both funnel into `ResourceNotFoundError` →
 *   `HttpNotFound`, indistinguishable at this boundary. Because the
 *   fixtures read alongside this one already fulfilled for this exact
 *   `psdTeamId`, a same-id 404 here overwhelmingly means "not published
 *   yet," so it degrades to `no-table`, never `ranking-unavailable` — the
 *   identical carve-out `/wedstrijd/[matchId]`'s `fetchStandings` makes
 *   (#2576/#2778). Only `ParseError`/`HttpApiDecodeError` — a response this
 *   deploy genuinely cannot decode — still reach `degradeIfPermanent` and
 *   degrade to `null`.
 * - The **matches** read goes through `getTeamMatches`, whose channel is
 *   already flattened to a rejecting `Promise` by the #2441 dedupe below, so
 *   it cannot be classified before it becomes one. `isPermanentBffFailure`
 *   inspects the rejection's tag after the fact instead. A permanent failure
 *   HERE is the only case that still returns the `"unavailable"` sentinel:
 *   without fixtures there is no way to tell whether the team is even in
 *   competition, so the whole block collapses exactly as it did before.
 *
 * Either way, a transient failure is rethrown unchanged, preserving the
 * throw-for-ISR-fallback behaviour above.
 *
 * `degradeIfPermanent` is not yet universal: `app/sitemap.ts`,
 * `(main)/ploegen/[slug]/wedstrijden/page.tsx`, `(main)/share/page.tsx`, and
 * `(main)/tegenstander/[clubId]/page.tsx` still hand-spell a narrower version
 * of this split as a bare `Effect.catchTag("HttpNotFound", ...)` — catching
 * only the 404 case, not the full three-tag permanent classifier. Converging
 * them is deliberately not done here: it would widen what they catch to
 * `ParseError`/`HttpApiDecodeError` too, a behaviour change beyond what those
 * routes asked for. Tracked in #2782.
 */
async function fetchBffData(
  psdTeamId: number,
): Promise<BffData | "unavailable"> {
  const [matchesResult, standingsResult] = await Promise.allSettled([
    // Via `getTeamMatches` because this page mounts its own
    // `<MatchStripSlot />` further down, and on `/ploegen/eerste-elftallen-a`
    // the strip resolves to this very psdId — the same double-read the
    // homepage had (#2441).
    getTeamMatches(psdTeamId),
    runPromise(
      degradeIfPermanent(
        Effect.gen(function* () {
          const bff = yield* BffService;
          return yield* bff.getRanking(psdTeamId);
        }).pipe(
          // `apps/api/src/handlers/ranking.ts` maps BOTH "no ranking
          // published yet" (an empty upstream table list — the handler's own
          // `tables.length === 0` guard) AND a genuinely unknown/stale PSD
          // team id (`classifyHttpError` in `apps/api/src/psd/service.ts`,
          // any upstream 404) to the exact same `HttpNotFound` — the two
          // are indistinguishable from the HTTP status alone (verified
          // against both source files, #2795 review). This read already
          // knows the team exists in PSD: the fixtures read alongside it
          // fulfilled for this very `psdTeamId`, so a same-id 404 here
          // overwhelmingly means "not published yet," not "no such team."
          // Resolve it to `[]` BEFORE `degradeIfPermanent` classifies it,
          // the same split `/wedstrijd/[matchId]`'s `fetchStandings` already
          // makes for the identical BFF ambiguity (#2576/#2778) — so
          // `no-table` stays reachable against real data, instead of every
          // not-yet-published youth ranking reading as `ranking-unavailable`.
          Effect.catchTag("HttpNotFound", () => Effect.succeed([])),
        ),
        null,
      ),
    ),
  ]);

  if (matchesResult.status === "rejected") {
    if (!isPermanentBffFailure(matchesResult.reason)) {
      throw matchesResult.reason;
    }
    return "unavailable";
  }
  if (standingsResult.status === "rejected") {
    // Every permanent ranking tag is caught above; a rejection here is
    // transient by construction.
    throw standingsResult.reason;
  }

  // `standingsResult.value` is `null` on a permanent ranking failure (#2795)
  // — no longer collapsed to the `"unavailable"` sentinel. The fixtures that
  // fulfilled above are kept; `deriveCompetitiveBlockState` reads a `null`
  // standings into `ranking-unavailable`, distinct from the fulfilled `[]`
  // it reads into `no-table`.
  return {
    matches: matchesResult.value,
    standings: standingsResult.value,
    teamId: psdTeamId,
  };
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

  const displayName = team.displayName;
  const psdTeamId = team.psdId ? parseInt(team.psdId, 10) : NaN;

  // Both depend only on `team`, never on each other, so they share one wave
  // rather than serializing Sanity behind the BFF pair (#2441).
  //
  // #2627 guard: no `<Suspense>` boundary between the content-store (Sanity)
  // read above and this PSD wave, on this route or on
  // `/ploegen/[slug]/wedstrijden`, without re-reading #2627 first. #2627
  // measured that streaming here pays for itself on ~18 requests per deploy
  // and costs a real 404 status code and the throw `fetchBffData` now relies
  // on: once a shell flushes, the response is locked at 200 and a PSD
  // rejection can only resolve *inside* the stream as error UI — which is
  // exactly the "cached lie" #2540/#2636 removed the two catches to avoid.
  const [relatedArticles, bffData] = await Promise.all([
    // Same section, same verdict as `/spelers/[slug]` and `/staf/[slug]`
    // (#2433 rule 3/4): "Blijf nog even hangen." is polish, and its absence
    // asserts nothing, so it hides rather than taking the team page down.
    runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findRelated(team.id);
        }),
        [],
        "[ploegen/[slug]] related-articles lookup failed; rendering without the RelatedRow.",
      ),
    ),
    Number.isFinite(psdTeamId) && psdTeamId > 0
      ? fetchBffData(psdTeamId)
      : null,
  ]);

  // `bffData` collapses `null` (no usable psdId) and `"unavailable"`
  // (permanent failure on the FIXTURES read) to the same "nothing to read
  // from" shape here — `competitiveState` below is what still tells the two
  // apart for the status line's copy (#2636 finding 8). A permanent failure
  // on the RANKING read alone does not collapse here: `bffOutcome.standings`
  // stays `null` in that case (#2795), read below into `standings` via `??
  // []` purely so `<StandingsSection>` never receives `null` on the one
  // branch that still renders it — that branch is never reached when
  // `standings` is actually `null` (see `competitiveState.kind ===
  // "ranking-unavailable"` further down).
  const bffOutcome = bffData === "unavailable" ? null : bffData;
  const bffTeamId = bffOutcome?.teamId;
  const standings = bffOutcome?.standings ?? [];
  const scheduleMatches = (bffOutcome?.matches ?? []).map(
    transformMatchToSchedule,
  );
  const staff = team.staff.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    functionTitle: s.functionTitle,
    role: s.role,
    imageUrl: s.imageUrl,
    href: s.href,
  }));

  const teamBody = team.body as PortableTextBlock[] | null;
  const teamContact = team.contactInfo as PortableTextBlock[] | null;

  // The competitive block — `#klassement` + `#wedstrijden` — is gated as ONE
  // unit, replacing the two independent `showStandings` / `showMatches`
  // flags this used to derive inline (#2636). `bffData` is `null` only when
  // the team carries no usable PSD id (a deliberate skip, not a failure) and
  // `"unavailable"` when `fetchBffData` caught a *permanent* failure on the
  // FIXTURES read (#2636 finding 3) — a *transient* failure never reaches
  // here at all, since `fetchBffData` lets that one reject and take the
  // render down so ISR can serve the last-good page. A permanent failure on
  // the RANKING read alone does not collapse `bffData` at all (#2795): it
  // still carries the fulfilled fixtures, with `standings: null`.
  //
  // `klassementLabel` is `competitiveBlockHeadingLabel(competitiveState)` —
  // it switches on every member of `CompetitiveBlockState` and returns
  // `null` for the three kinds that earn no `#klassement` nav entry
  // (`not-in-competition`, `fixtures-unavailable`, and, since #2795,
  // `ranking-unavailable` — its failure notice is not a section either).
  //
  // `inCompetition` is DELIBERATELY NOT `klassementLabel !== null` (#2795):
  // that reads `ranking-unavailable`'s null label as "not in competition"
  // and re-hides the fixtures that fulfilled — the exact bug this ticket
  // fixes. `isCompetitiveBlockOpen` is the single exported predicate for
  // this gate, switching on every member so a state added later fails to
  // compile here rather than silently falling out of sync with a
  // hand-written exclusion (#2636 finding 5 rejected that shape).
  const competitiveState = deriveCompetitiveBlockState(bffData);
  const klassementLabel = competitiveBlockHeadingLabel(competitiveState);
  const inCompetition = isCompetitiveBlockOpen(competitiveState);
  const rankingUnavailable = competitiveState.kind === "ranking-unavailable";

  // Section render flags — keep the sticky nav in sync with each section's
  // own auto-hide so the nav never lists a section that doesn't render.
  //
  // `#wedstrijden` gets its OWN flag rather than reusing `inCompetition`
  // directly: the fixture gate can be open (a league match exists this
  // season) while every individual fixture is postponed/cancelled/forfeited/
  // stopped, or stuck at `"scheduled"` in the past — `<TeamMatchesSection>`
  // would then self-hide beneath an unconditionally-rendered seam and nav
  // chip. `hasVisibleMatches` is the exact predicate that component uses
  // internally, so this can never drift from what it actually renders
  // (#2636 finding 2) — PROVIDED both read the same instant. This page is
  // ISR-cached for up to 15 minutes with `showWedstrijden` baked into the
  // HTML, while `<TeamMatchesSection>` re-derives on client hydration with
  // its own clock read; two independent `new Date()` calls can disagree by
  // up to that whole cache window (a fixture crossing kickoff between the
  // two), not milliseconds. One snapshot, threaded to both call sites,
  // closes that (review round 3, PR #2774).
  const now = new Date();
  const showSquad = team.players.length > 0;
  const showStaff = staff.length > 0;
  const showWedstrijden =
    inCompetition && hasVisibleMatches(scheduleMatches, now);
  const showEditorial =
    (teamBody !== null && hasRenderableBioContent(teamBody)) ||
    (team.trainingSchedule?.length ?? 0) > 0 ||
    (teamContact !== null && hasRenderableBioContent(teamContact));

  // One record for every section's label — the nav chip and each section's
  // own `aria-label` (on its focus target below) read from the same value,
  // so the two can never drift. Unlike the other four entries,
  // `sectionLabels.klassement` CAN be null while `inCompetition` is true
  // (#2795: the `ranking-unavailable` state opens the block for
  // `#wedstrijden` but has no klassement heading to give) — the render below
  // only reads `sectionLabels.klassement!` on the branch that renders
  // `<StandingsSection>`, which is gated on `klassementLabel !== null`
  // separately from `inCompetition`.
  const sectionLabels = {
    klassement: klassementLabel,
    wedstrijden: "Wedstrijden",
    spelers: "Spelers",
    staf: "Staf",
    info: "Info",
  } as const;

  // Three states render something in place of `#klassement` that is not a
  // section and so earns no nav entry: the two status-line states
  // (`not-in-competition` / `fixtures-unavailable`, #2540/#2636 decision)
  // and, since #2795, `ranking-unavailable`'s failure notice — its
  // `<EmptyState tier="slot" reason="unavailable">` gets no `<h2>` and no
  // `id` either, for the same reason `<CompetitiveStatusLine>` doesn't:
  // `klassementLabel !== null` is exactly the gate for all three at once.
  // `#wedstrijden` is unaffected by any of this — it keeps its own nav entry
  // under `ranking-unavailable` because the fixtures still rendered in full.
  // Every other item here is kept in exact sync with what actually renders
  // further down.
  const navItems: TeamSectionNavItem[] = [
    // `sectionLabels.klassement` is the same value as `klassementLabel`,
    // but TS narrows the bare variable, not a property read off it — the
    // guard stays on the variable, the label comes from the shared record.
    klassementLabel !== null && {
      id: "klassement",
      label: klassementLabel,
    },
    showWedstrijden && { id: "wedstrijden", label: sectionLabels.wedstrijden },
    showSquad && { id: "spelers", label: sectionLabels.spelers },
    showStaff && { id: "staf", label: sectionLabels.staf },
    showEditorial && { id: "info", label: sectionLabels.info },
  ].filter((x): x is TeamSectionNavItem => x !== false);

  const analyticsParams = { team_slug: slug };

  // #2443 rule 4 originally put the team's own fixture-list route
  // (`/ploegen/[slug]/wedstrijden`) in the domain tier here. Dropped (review
  // round 1, #2788): it has no Sanity document behind it, so the card was a
  // synthetic `RelatedRowItem` whose `analyticsTargetSlug` embedded a `/`
  // (`${slug}/wedstrijden`) — breaking the "slug for every type except
  // players" contract every other card in the row honours — AND it
  // duplicated the `#wedstrijden` section + its section-nav chip already
  // rendered on this same page, both gated on the identical
  // `showWedstrijden` flag. No domain items remain for this route; the row
  // runs on the reference tier alone.
  const relatedRowItems = mergeRelatedRow({
    domain: [],
    curated: [],
    reference: articleVMsToRelatedRowItems(relatedArticles),
    semantic: [],
    siblings: [],
  });

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Ploegen", url: `${SITE_CONFIG.siteUrl}/ploegen` },
          { name: displayName, url: `${SITE_CONFIG.siteUrl}/ploegen/${slug}` },
        ])}
      />
      <JsonLd
        data={buildSportsTeamJsonLd({
          // Deliberately NOT the display name: `SportsTeam.name` is a
          // machine-readable claim about a federation-registered entity, not a
          // nickname. The breadcrumb above is a human-facing trail, so that one
          // follows the heading (#2630).
          name: team.name,
          url: `${SITE_CONFIG.siteUrl}/ploegen/${slug}`,
        })}
      />
      <PageViewTracker eventName="team_detail_view" params={analyticsParams} />

      <MatchStripSlot />

      <PageContainer>
        <UpLink href="/ploegen" label="Ploegen" className="mb-6" />
        <TeamHero
          displayName={displayName}
          teamType={team.teamType}
          ageGroup={team.ageGroup}
          division={team.division}
          divisionFull={team.divisionFull}
          tagline={team.tagline}
          teamImageUrl={team.teamImageUrl}
          className="py-8 sm:py-12"
        />
      </PageContainer>

      <TeamSectionNav items={navItems} />

      {/* The competitive block — #klassement + #wedstrijden — renders as ONE
          gated unit (#2540/#2636), open whenever `isCompetitiveBlockOpen`
          says so, or a status line takes both sections' place
          (pre-publication, or a permanently-failed FIXTURES read).
          `#wedstrijden` carries its own `showWedstrijden` flag beneath that
          gate — see the comment beside it above — so an empty section can
          never sit behind a live nav chip. Since #2795, being "open" no
          longer implies `#klassement` renders `<StandingsSection>`: a
          permanently-failed RANKING read (`rankingUnavailable`) keeps the
          block open for `#wedstrijden` but replaces the klassement slot with
          a failure notice instead — no `<h2>`, no `id`, matching the status
          line's own nav/render-invariant exception. */}
      {!inCompetition ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <PageContainer className="py-10">
            <CompetitiveStatusLine
              variant={
                competitiveState.kind === "fixtures-unavailable"
                  ? "unavailable"
                  : "not-in-competition"
              }
            />
          </PageContainer>
        </>
      ) : (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          {rankingUnavailable ? (
            <PageContainer className="py-10">
              <EmptyState
                tier="slot"
                reason="unavailable"
                emphasis={{ text: "even niet beschikbaar" }}
              >
                Het klassement is even niet beschikbaar. Probeer het later
                opnieuw.
              </EmptyState>
            </PageContainer>
          ) : (
            <TrackInView
              eventName="team_standings_in_view"
              params={analyticsParams}
            >
              <PageContainer
                as="section"
                id="klassement"
                tabIndex={-1}
                // Non-null: this branch only renders when `klassementLabel`
                // is non-null (the `rankingUnavailable` guard above excludes
                // the one `inCompetition` state where it wouldn't be), but TS
                // narrows the variable, not a property read off the record.
                ariaLabel={sectionLabels.klassement!}
                className="py-10 focus:outline-none"
              >
                <StandingsSection
                  tables={standings}
                  divisionFull={team.divisionFull}
                  highlightTeamId={bffTeamId}
                />
              </PageContainer>
            </TrackInView>
          )}

          {showWedstrijden ? (
            <>
              <StripedSeam colorPair="ink-cream" height="md" />
              <TrackInView
                eventName="team_matches_in_view"
                params={analyticsParams}
              >
                <PageContainer
                  as="section"
                  id="wedstrijden"
                  tabIndex={-1}
                  ariaLabel={sectionLabels.wedstrijden}
                  className="py-10 focus:outline-none"
                >
                  <TeamMatchesSection
                    matches={scheduleMatches}
                    teamSlug={slug}
                    kcvvTeamId={bffTeamId}
                    now={now}
                  />
                </PageContainer>
              </TrackInView>
            </>
          ) : null}
        </>
      )}

      {showSquad ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <TrackInView eventName="team_squad_in_view" params={analyticsParams}>
            <PageContainer
              as="section"
              id="spelers"
              tabIndex={-1}
              ariaLabel={sectionLabels.spelers}
              className="py-10 focus:outline-none"
            >
              <SquadGrid players={team.players} />
            </PageContainer>
          </TrackInView>
        </>
      ) : null}

      {/* Youth-only "Word lid" enrolment CTA (#1949). Gate the seam + section
          here so senior pages get no empty chrome; <TeamEnrolmentCta> also
          self-gates (returns null for senior). No section-nav anchor — it's a
          CTA, not navigable content. */}
      {team.teamType === "youth" ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <PageContainer as="section" className="py-10">
            <TeamEnrolmentCta
              teamType={team.teamType}
              teamSlug={slug}
              ageGroup={team.ageGroup}
            />
          </PageContainer>
        </>
      ) : null}

      {showStaff ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <PageContainer
            as="section"
            id="staf"
            tabIndex={-1}
            ariaLabel={sectionLabels.staf}
            className="py-10 focus:outline-none"
          >
            <TeamStaff staff={staff} heading="Staf" />
          </PageContainer>
        </>
      ) : null}

      {showEditorial ? (
        <>
          <StripedSeam colorPair="ink-cream" height="md" />
          <PageContainer
            as="section"
            id="info"
            tabIndex={-1}
            ariaLabel={sectionLabels.info}
            className="py-10 focus:outline-none"
          >
            <TeamEditorial
              body={teamBody}
              trainingSchedule={team.trainingSchedule}
              contactInfo={teamContact}
            />
          </PageContainer>
        </>
      ) : null}

      {/* Sponsor logo wall now renders BEFORE the onward-navigation row
          (#2443 resolution) — the page's last word is a "keep going"
          slot, not a sponsor band. */}
      <SponsorsSection />

      {/* Full-bleed cream "Blijf nog even hangen." slider — auto-hides when
          empty (#2443/#2581). Last section on the page. */}
      <RelatedRow items={relatedRowItems} pageType="team" pageSlug={slug} />
    </>
  );
}

// 15 min ISR — the page renders live PSD match data (fixtures + standings), so
// its cache is aligned to the BFF freshness window. Editor publishes still
// invalidate rosters on demand via /api/revalidate (revalidateTag 'teams').
export const revalidate = 900;
