/**
 * Opponent History Page — /tegenstander/[clubId]
 *
 * Shows all historical KCVV senior-team matches against a specific opponent
 * club, with a W/D/L summary and a season-grouped match list on the
 * retro-terrace system (#2141).
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
import type { Match, OpponentHistory } from "@kcvv/api-contract";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import {
  Crest,
  EditorialHeading,
  EmptyState,
  PageContainer,
  StripedSeam,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { TeamAgendaRow } from "@/components/team/TeamMatchesSection";
import { transformMatchToSchedule } from "@/components/match";
import { getResultColor } from "@/lib/utils/match-display";
import { pendingEmptyBody } from "@/lib/utils/empty-state-copy";
import { groupBySeason } from "@/lib/utils/season";
import { OpponentSummaryCard } from "./OpponentSummaryCard";

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
 * Retrieve the opponent's head-to-head history against KCVV's senior teams.
 *
 * Wrapped in React `cache()` so `generateMetadata` and the page component
 * share one read: they run in the same render pass with the same `clubId`,
 * and Next's `fetch` memoization cannot collapse them because
 * `@effect/platform` always attaches an `AbortSignal`, which opts the
 * request out of it — same pattern and reason as `/wedstrijd/[matchId]`'s
 * `fetchMatchOrNotFound` (#2441). Per-render only — no TTL, see
 * `BffServiceLive` (#2389). Getting this wrong doubles the live PSD hops on
 * a read path that already 429s, on every cold render.
 */
const fetchOpponentData = cache(async function fetchOpponentData(
  clubId: number,
): Promise<{
  opponentName: string;
  opponentLogo?: string;
  summary: OpponentHistory["summary"];
  matches: Match[];
} | null> {
  return await runPromise(
    Effect.gen(function* () {
      const teamRepo = yield* TeamRepository;
      const bff = yield* BffService;

      const allTeams = yield* teamRepo.findAll();
      const seniorTeams = allTeams.filter(
        (t) => t.age === "A" && t.psdId != null,
      );

      if (seniorTeams.length === 0) return null;

      // Fetch opponent history for each senior team; swallow 404s, propagate other errors
      const results = yield* Effect.all(
        seniorTeams.map((team) =>
          bff.getOpponentHistory(parseInt(team.psdId!, 10), clubId).pipe(
            Effect.map((h) => ({ _tag: "ok" as const, history: h })),
            Effect.catchTag("HttpNotFound", () =>
              Effect.succeed({ _tag: "failed" as const, history: null }),
            ),
          ),
        ),
        { concurrency: 3 },
      );

      const successful = results
        .filter((r) => r._tag === "ok" && r.history != null)
        .map((r) => r.history!);

      if (successful.length === 0) return null;

      // Aggregate matches from all teams (flatten)
      const allMatches = successful.flatMap((h) => h.matches);

      // Use BFF-computed summaries directly — avoids re-deriving is_home on the client
      const wins = successful.reduce((sum, h) => sum + h.summary.wins, 0);
      const draws = successful.reduce((sum, h) => sum + h.summary.draws, 0);
      const losses = successful.reduce((sum, h) => sum + h.summary.losses, 0);
      const goalsFor = successful.reduce(
        (sum, h) => sum + h.summary.goalsFor,
        0,
      );
      const goalsAgainst = successful.reduce(
        (sum, h) => sum + h.summary.goalsAgainst,
        0,
      );

      // Sort all matches descending by date (scheduled future matches surface first)
      const sortedMatches = [...allMatches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      // Derive opponent metadata from the most recent match (newest logo/name)
      const newestMatch = sortedMatches[0];
      const opponentTeam = newestMatch
        ? newestMatch.home_team.id === clubId
          ? newestMatch.home_team
          : newestMatch.away_team
        : null;
      const fallback = successful[0]!;
      return {
        opponentName: opponentTeam?.name ?? fallback.opponent.name,
        opponentLogo: opponentTeam?.logo ?? fallback.opponent.logo,
        summary: { wins, draws, losses, goalsFor, goalsAgainst },
        matches: sortedMatches,
      };
    }),
  );
});

export default async function OpponentPage({ params }: OpponentPageProps) {
  const { clubId: clubIdStr } = await params;
  const clubId = parseInt(clubIdStr, 10);

  if (isNaN(clubId)) notFound();

  const data = await fetchOpponentData(clubId);
  if (!data) notFound();

  const { opponentName, opponentLogo, summary, matches } = data;
  const seasons = groupBySeason(matches, (m) => m.date);
  const matchCountLabel = `${matches.length} ${
    matches.length === 1 ? "wedstrijd" : "wedstrijden"
  }`;

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
      <PageContainer className="pt-8 pb-8">
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

        <OpponentSummaryCard summary={summary} className="mt-7" />

        <div className="mt-8 mb-5">
          <StripedSeam height="sm" />
        </div>

        <EditorialHeading
          level={2}
          size="display-sm"
          emphasis={{ text: ".", tone: "warm" }}
          className="mb-4"
        >
          {matchCountLabel}
        </EditorialHeading>

        {seasons.length === 0 ? (
          // as="h3": the matchCountLabel h2 directly above already opens
          // this section — a second consecutive h2 would be a collision,
          // not a new section (#2562 review).
          <EmptyState
            tier="surface"
            heading="Nog geen onderlinge duels gespeeld"
            as="h3"
          >
            {pendingEmptyBody("KCVV tegen deze ploeg speelt", "de wedstrijd")}
          </EmptyState>
        ) : (
          seasons.map((group) => (
            <section
              key={group.season.key}
              aria-label={group.season.label}
              className="mt-5 first:mt-0"
            >
              <SeasonBand
                label={group.season.label}
                tally={seasonTally(group.items)}
              />
              <div className="flex flex-col gap-2.5">
                {group.items.map((match) => (
                  <TeamAgendaRow
                    key={match.id}
                    match={transformMatchToSchedule(match)}
                    captionLabel={match.kcvv_team_label}
                    upcomingLabel="Gepland"
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </PageContainer>
    </div>
  );
}
