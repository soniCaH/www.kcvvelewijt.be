/**
 * Opponent History Page — /tegenstander/[clubId]
 *
 * Shows one self-contained section per flagship senior squad (A, then B)
 * against a specific opponent club — its own W/D/L summary and its own
 * season-grouped match list, on the retro-terrace system (#2141). Never one
 * blended record: #2463 removed the page's `reduce` across squads, which had
 * been folding Reserven's matches into the A-team's tally under a wrong
 * "A-Ploeg" caption.
 *
 * Not in navigation. Noindex — personal statistics/preview tool.
 *
 * Design lock: docs/design/mockups/phase-10-tegenstander/10t4-locked.html
 */

import { cache } from "react";
import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import type { Match } from "@kcvv/api-contract";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import {
  Crest,
  EditorialHeading,
  PageContainer,
  StripedSeam,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { TeamAgendaRow } from "@/components/team/TeamMatchesSection";
import { transformMatchToSchedule } from "@/components/match";
import { selectSeniorTeams } from "@/components/home";
import { getResultColor } from "@/lib/utils/match-display";
import { groupBySeason } from "@/lib/utils/season";
import { OpponentSummaryCard } from "./OpponentSummaryCard";
import {
  buildOpponentPageData,
  matchCountLabel,
  type OpponentPageData,
  type SquadOpponentSection,
} from "./opponent-data";

/** Not-found metadata for an unparseable or unknown `clubId`. `robots` is
 *  still carried here — a 404'd opponent page must never become indexable
 *  just because the not-found branch forgot the tag. */
const NOT_FOUND_METADATA: Metadata = {
  title: "Tegenstander niet gevonden",
  robots: { index: false, follow: false },
};

/**
 * Head-to-head description shared by the page's own lead paragraph and its
 * metadata `description`/`og:description` — one phrasing, two surfaces, so
 * they never drift apart. Not a Writer Rule fallback-chain case (that
 * carve-out, in `apps/web/CLAUDE.md` under "The Writer Rule — rendering
 * absence", licenses metadata *composing a fallback chain* a rendered slot
 * never would, e.g. `tagline ?? divisionFull ?? division`); this is simpler
 * — #2464 asks for the page's existing lead verbatim, not a second phrasing
 * invented beside it, so both surfaces call this one function.
 */
function opponentHistoryDescription(opponentName: string): string {
  return `Alle onderlinge duels tussen KCVV Elewijt en ${opponentName}, per seizoen.`;
}

/**
 * Build SEO metadata for the opponent history page using the route `clubId`.
 *
 * `robots: { index: false, follow: false }` is set on every branch — this
 * route stays noindex (triage 2026-09-10) regardless of whether the opponent
 * resolves. No `alternates` on any branch either: `buildPageMetadata` is
 * explicitly "not for noindex routes" (see `src/lib/seo/page-metadata.ts`),
 * so this Metadata object is hand-rolled the way `/wedstrijd/[matchId]` is,
 * minus its `alternates`.
 *
 * The title deliberately does not reuse `/wedstrijd/[matchId]`'s
 * `"KCVV Elewijt vs <opponent>"` string — this page is the whole head-to-head
 * record, not one match, so it borrows the page's own "Onderlinge
 * geschiedenis" kicker instead.
 */
export async function generateMetadata({
  params,
}: OpponentPageProps): Promise<Metadata> {
  const { clubId: clubIdStr } = await params;
  const clubId = parseInt(clubIdStr, 10);

  if (isNaN(clubId)) {
    return NOT_FOUND_METADATA;
  }

  try {
    const data = await fetchOpponentData(clubId);
    if (!data) {
      return NOT_FOUND_METADATA;
    }

    const { opponentName } = data;
    const title = `Onderlinge geschiedenis met ${opponentName}`;
    const description = opponentHistoryDescription(opponentName);

    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title,
        description,
        type: "website",
        images: [DEFAULT_OG_IMAGE],
      },
    };
  } catch {
    // Mirrors /wedstrijd/[matchId]'s generateMetadata: a genuine upstream
    // failure degrades metadata generation to the not-found title rather
    // than 500ing here. The page component awaits the same memoized read
    // separately and surfaces the real failure through Next's error
    // boundary (or notFound() for a genuinely unknown club).
    return NOT_FOUND_METADATA;
  }
}

// 15 min ISR — renders live PSD opponent-match history, aligned to the BFF
// freshness window.
export const revalidate = 900;

// No static prerendering — the body fetches live PSD data via the rate-limited
// BFF. Empty, but required: without this export the segment never enters the
// ISR cache and `revalidate` is inert (#2391).
export async function generateStaticParams() {
  return [];
}

interface OpponentPageProps {
  params: Promise<{ clubId: string }>;
}

/**
 * KCVV-perspective result of a single match. Finished matches only — the locked
 * status vocabulary from #2117 (scheduled/postponed/… never count toward a
 * tally). Mirrors the BFF summary computation so per-season tallies sum to the
 * hero card totals.
 */
function getMatchOutcome(match: Match): "win" | "draw" | "loss" | null {
  if (match.status !== "finished" || match.is_home == null) return null;
  const homeScore = match.home_team.score;
  const awayScore = match.away_team.score;
  if (homeScore == null || awayScore == null) return null;
  return getResultColor(homeScore, awayScore, match.is_home);
}

/** Per-season tally caption, e.g. `"2W · 1G"` or `"1 gepland"`. */
function seasonTally(matches: readonly Match[]): string {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let scheduled = 0;
  for (const match of matches) {
    const outcome = getMatchOutcome(match);
    if (outcome === "win") wins += 1;
    else if (outcome === "draw") draws += 1;
    else if (outcome === "loss") losses += 1;
    else if (match.status === "scheduled") scheduled += 1;
  }
  const parts: string[] = [];
  if (wins) parts.push(`${wins}W`);
  if (draws) parts.push(`${draws}G`);
  if (losses) parts.push(`${losses}V`);
  if (scheduled) parts.push(`${scheduled} gepland`);
  return parts.join(" · ");
}

/** Warm mono band that opens each season group. */
function SeasonBand({ label, tally }: { label: string; tally: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="border-ink bg-warm text-ink border-2 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
        {label}
      </span>
      {/* Raw dotted rule rather than <DottedDivider>: the divider hardcodes
          role="separator" + full width and takes no flex-grow, which doesn't
          fit this decorative chip · rule · tally row. */}
      <span
        aria-hidden="true"
        className="border-ink h-0 flex-1 border-t-2 border-dotted"
      />
      {tally ? (
        <span className="text-ink-muted font-mono text-[9px] tracking-wide uppercase">
          {tally}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Retrieve each flagship senior squad's own head-to-head history against
 * this opponent — one BFF read per squad, never summed together (#2463).
 *
 * Wrapped in React `cache()` so `generateMetadata` and the page component
 * share one read: they run in the same render pass with the same `clubId`,
 * and Next's `fetch` memoization cannot collapse them because
 * `@effect/platform` always attaches an `AbortSignal`, which opts the
 * request out of it — same pattern and reason as `/wedstrijd/[matchId]`'s
 * `fetchMatchOrNotFound` (#2441). Per-render only — no TTL, see
 * `BffServiceLive` (#2389). Getting this wrong doubles the live PSD hops on
 * a read path that already 429s, on every cold render.
 *
 * Squad selection reuses `selectSeniorTeams` (the same helper the homepage
 * first-team block and `/scheurkalender` already share) instead of a local
 * `age === "A"` test — that local test is what let Reserven (whose Sanity
 * `age` is also `"A"`) leak onto this page once #2414 flipped its
 * `showInNavigation` on. All the aggregation logic itself lives in the pure,
 * unit-tested `buildOpponentPageData` (`./opponent-data.ts`); this function
 * stays thin Effect plumbing — fan out, catch, hand the raw reads over.
 */
const fetchOpponentData = cache(async function fetchOpponentData(
  clubId: number,
): Promise<OpponentPageData | null> {
  return await runPromise(
    Effect.gen(function* () {
      const teamRepo = yield* TeamRepository;
      const bff = yield* BffService;

      const allTeams = yield* teamRepo.findAll();
      const seniorTeams = selectSeniorTeams(allTeams);

      if (seniorTeams.length === 0) return null;

      // Fetch opponent history for each senior squad; swallow 404s, propagate other errors
      //
      // Deliberately narrow (#2782), not converged onto `degradeIfPermanent`'s
      // three-tag split — and this is the site where widening is riskiest of
      // all five. The catch is per squad inside this bounded-concurrency
      // fan-out (`concurrency: 3`): a genuinely unknown squad/opponent
      // pairing (`HttpNotFound`) already degrades to `history: null` below,
      // and the page only calls `notFound()` once every squad has failed —
      // `buildOpponentPageData` returning `null` further down. Widening this
      // per-squad catch would fold `ParseError`/`HttpApiDecodeError` into
      // that same sentinel: one squad's contract-decode failure would
      // silently read as "never played this opponent" instead of a failure —
      // no signal anything went wrong. At this route's 15-minute ISR window
      // (`revalidate` above), that wrong read is what every visitor sees for
      // the whole window, not just the one request that hit the decode
      // failure.
      //
      // The ISR fallback this narrow catch protects — a rejected fan-out
      // throws, and a *cached* route keeps serving its last-good render
      // instead of the wrong read — only exists once this route has
      // successfully rendered at least once. On a cold render (first hit,
      // or right after a redeploy) there is no last-good page yet, so the
      // same throw sends the visitor straight to the error boundary instead.
      // Staying narrow is the better of two imperfect outcomes, not a
      // guarantee that throwing is free.
      const results = yield* Effect.all(
        seniorTeams.map((team) => {
          // selectSeniorTeams only admits teams carrying a psdId.
          // team.displayName is already the canonical display name
          // (teamDisplayName, resolved by TeamRepository's toTeamNavVM) —
          // taken as-is, never re-derived.
          const psdId = team.psdId!;
          const squadTeam = { psdId, squadLabel: team.displayName };
          return bff.getOpponentHistory(parseInt(psdId, 10), clubId).pipe(
            Effect.map((history) => ({ team: squadTeam, history })),
            Effect.catchTag("HttpNotFound", () =>
              Effect.succeed({ team: squadTeam, history: null }),
            ),
          );
        }),
        { concurrency: 3 },
      );

      return buildOpponentPageData(clubId, results);
      // Subject read: the senior-team list and each squad's opponent history
      // together are this page's entire content, so an unclassified failure
      // takes it down with it via `Effect.orDie` — the per-squad 404 above is
      // already resolved to a value, not left to reject (#2864).
    }).pipe(Effect.orDie),
  );
});

/**
 * One flagship senior squad's self-contained section — its own `h2` heading
 * (the canonical display name), its own unreduced `<OpponentSummaryCard>`,
 * its own `"N wedstrijden"` count and its own season-grouped match list.
 * Rendered once per entry in `OpponentPageData["sections"]` — A first, then
 * B, the order `selectSeniorTeams` already guarantees (#2463).
 *
 * A squad section is only ever built from a non-empty `matches` array
 * (`buildOpponentPageData` drops any squad with none), so `groupBySeason`
 * below always yields at least one group — there is no "no matches yet"
 * branch to render inside a section, unlike the route-level `notFound()`
 * case above it, which still covers "no squad has any history at all".
 *
 * The wrapping `<section>` is this squad's only landmark — labelled with its
 * own `squadLabel`, so two squads on one page never share an accessible
 * name. Each season group below is a plain `<div>`, not a nested landmark:
 * the previous single-section page gave every season group its own
 * `<section aria-label={seasonLabel}>`, which would collide once the same
 * season appears under both squads.
 */
function SquadHistorySection({
  section,
  className,
}: {
  section: SquadOpponentSection;
  className?: string;
}) {
  const seasons = groupBySeason(section.matches, (m) => m.date);
  const countLabel = matchCountLabel(section.matches.length);

  return (
    <section aria-label={section.squadLabel} className={className}>
      <EditorialHeading level={2} size="display-sm" className="mb-4">
        {section.squadLabel}
      </EditorialHeading>

      <OpponentSummaryCard
        summary={section.summary}
        testId={`opponent-summary-${section.teamPsdId}`}
      />

      <div className="mt-8 mb-5">
        <StripedSeam height="sm" />
      </div>

      {/* level=3, not 2: the squad heading directly above already opens
          this section (#2463) — a second consecutive h2 would be a
          collision, not a new section (the same #2562 rule the former
          page-wide empty state honoured). */}
      <EditorialHeading
        level={3}
        size="display-sm"
        emphasis={{ text: ".", tone: "warm" }}
        className="mb-4"
      >
        {countLabel}
      </EditorialHeading>

      {seasons.map((group) => (
        <div key={group.season.key} className="mt-5 first:mt-0">
          <SeasonBand
            // The helper returns the bare `’25/’26`; this band is the one
            // surface with room for the word, so it supplies it (#2546).
            label={`Seizoen ${group.season.label}`}
            tally={seasonTally(group.items)}
          />
          <div className="flex flex-col gap-2.5">
            {group.items.map((match) => (
              // No captionLabel: every row in this section already belongs
              // to `section.squadLabel` — repeating it per row would print
              // the BFF's "A-Ploeg" beside this squad's own "A-ploeg", two
              // casings of one name on one page (#2463).
              <TeamAgendaRow
                key={match.id}
                match={transformMatchToSchedule(match)}
                upcomingLabel="Gepland"
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default async function OpponentPage({ params }: OpponentPageProps) {
  const { clubId: clubIdStr } = await params;
  const clubId = parseInt(clubIdStr, 10);

  if (isNaN(clubId)) notFound();

  const data = await fetchOpponentData(clubId);
  if (!data) notFound();

  const { opponentName, opponentLogo, sections } = data;
  const pageUrl = `${SITE_CONFIG.siteUrl}/tegenstander/${clubId}`;

  return (
    <div className="bg-cream-deep flex-1">
      {/* This was the one detail route with no breadcrumb trail at all
          (#2428) — everything else already shipped one as JSON-LD before
          this ticket's up-link could reuse it. */}
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Kalender", url: `${SITE_CONFIG.siteUrl}/kalender` },
          { name: opponentName, url: pageUrl },
        ])}
      />
      {/* Top air is the up-link chip's own now (#2877) — `<PageHero>`
          renders it above this opening at `tone="ink"`, so this container
          keeps only its bottom padding. Matches the skeleton's offset
          exactly, so the chip does not move when the page resolves. */}
      <PageContainer className="pb-8">
        <PageHero
          kicker="Onderlinge geschiedenis"
          headline={opponentName}
          lead={opponentHistoryDescription(opponentName)}
          adornment={
            <Crest
              name={opponentName}
              logo={opponentLogo}
              size={64}
              className="border-ink bg-cream-soft shadow-paper-sm rounded-full border-2"
            />
          }
          upLink={{ href: "/kalender", label: "Kalender" }}
        />

        {sections.map((section, index) => (
          <SquadHistorySection
            key={section.teamPsdId}
            section={section}
            className={index === 0 ? "mt-7" : "mt-12"}
          />
        ))}
      </PageContainer>
    </div>
  );
}
