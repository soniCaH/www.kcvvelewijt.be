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

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import type { Match, OpponentHistory } from "@kcvv/api-contract";
import {
  Crest,
  EditorialHeading,
  StripedSeam,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { TeamAgendaRow } from "@/components/team/TeamMatchesSection";
import { transformMatchToSchedule } from "@/components/match";
import { getResultColor } from "@/lib/utils/match-display";
import { groupBySeason } from "@/lib/utils/season";
import { OpponentSummaryCard } from "./OpponentSummaryCard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

async function fetchOpponentData(clubId: number): Promise<{
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
}

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

  return (
    <div className="bg-cream-deep min-h-screen">
      <div className="container mx-auto max-w-3xl px-4 pt-8 pb-8">
        <PageHero
          kicker="Onderlinge geschiedenis"
          headline={opponentName}
          lead={`Alle onderlinge duels tussen KCVV Elewijt en ${opponentName}, per seizoen.`}
          adornment={
            <Crest
              name={opponentName}
              logo={opponentLogo}
              size={64}
              className="border-ink bg-cream-soft shadow-paper-sm rounded-full border-2"
            />
          }
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
          <p className="text-ink-muted font-display italic">
            Nog geen onderlinge duels gespeeld.
          </p>
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
      </div>
    </div>
  );
}
