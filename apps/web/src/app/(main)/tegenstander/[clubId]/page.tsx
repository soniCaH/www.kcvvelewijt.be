/**
 * Opponent History Page — /tegenstander/[clubId]
 *
 * Shows all historical KCVV senior-team matches against a specific opponent club,
 * with W/D/L summary and a chronological match list.
 *
 * Not in navigation. Noindex — personal statistics/preview tool.
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import type { Match, OpponentHistory } from "@kcvv/api-contract";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface OpponentPageProps {
  params: Promise<{ clubId: string }>;
}

/** Transform a Match from api-contract into display-ready values. */
function formatMatchDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("nl-BE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getMatchResult(match: Match): "win" | "draw" | "loss" | null {
  if (match.is_home == null) return null;
  const homeScore = match.home_team.score;
  const awayScore = match.away_team.score;
  if (homeScore == null || awayScore == null) return null;
  const kcvvGoals = match.is_home ? homeScore : awayScore;
  const oppGoals = match.is_home ? awayScore : homeScore;
  if (kcvvGoals > oppGoals) return "win";
  if (kcvvGoals < oppGoals) return "loss";
  return "draw";
}

function computeCombinedSummary(matches: Match[]): OpponentHistory["summary"] {
  let wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0;
  for (const m of matches) {
    const homeScore = m.home_team.score;
    const awayScore = m.away_team.score;
    if (homeScore == null || awayScore == null || m.is_home == null) continue;
    const kcvvGoals = m.is_home ? homeScore : awayScore;
    const oppGoals = m.is_home ? awayScore : homeScore;
    goalsFor += kcvvGoals;
    goalsAgainst += oppGoals;
    if (kcvvGoals > oppGoals) wins++;
    else if (kcvvGoals < oppGoals) losses++;
    else draws++;
  }
  return { wins, draws, losses, goalsFor, goalsAgainst };
}

const resultBorderClass: Record<"win" | "draw" | "loss", string> = {
  win: "border-l-4 border-l-kcvv-success",
  draw: "border-l-4 border-l-kcvv-warning",
  loss: "border-l-4 border-l-kcvv-alert",
};

async function fetchOpponentData(clubId: number): Promise<{
  opponentName: string;
  opponentLogo?: string;
  summary: OpponentHistory["summary"];
  matches: Match[];
} | null> {
  try {
    return await runPromise(
      Effect.gen(function* () {
        const teamRepo = yield* TeamRepository;
        const bff = yield* BffService;

        const allTeams = yield* teamRepo.findAll();
        const seniorTeams = allTeams.filter(
          (t) => t.age === "A" && t.psdId != null,
        );

        if (seniorTeams.length === 0) return null;

        // Fetch opponent history for each senior team, ignore failures
        const results = yield* Effect.all(
          seniorTeams.map((team) =>
            bff.getOpponentHistory(parseInt(team.psdId!, 10), clubId).pipe(
              Effect.map((h) => ({ _tag: "ok" as const, history: h })),
              Effect.catchAll(() =>
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

        const { wins, draws, losses, goalsFor, goalsAgainst } =
          computeCombinedSummary(allMatches);

        // Sort all matches descending by date
        const sortedMatches = [...allMatches].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        const firstHistory = successful[0]!;
        return {
          opponentName: firstHistory.opponent.name,
          opponentLogo: firstHistory.opponent.logo,
          summary: { wins, draws, losses, goalsFor, goalsAgainst },
          matches: sortedMatches,
        };
      }),
    );
  } catch {
    return null;
  }
}

export default async function OpponentPage({ params }: OpponentPageProps) {
  const { clubId: clubIdStr } = await params;
  const clubId = parseInt(clubIdStr, 10);

  if (isNaN(clubId)) notFound();

  const data = await fetchOpponentData(clubId);
  if (!data) notFound();

  const { opponentName, opponentLogo, summary, matches } = data;
  const totalPlayed = summary.wins + summary.draws + summary.losses;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      {/* Opponent header */}
      <div className="mb-6 flex items-center gap-4">
        {opponentLogo && (
          <Image
            src={opponentLogo}
            alt={`Logo ${opponentName}`}
            width={64}
            height={64}
            className="rounded-full object-contain"
            unoptimized
          />
        )}
        <div>
          <p className="text-sm text-[var(--color-muted)]">Tegenstander</p>
          <h1 className="text-2xl font-bold">{opponentName}</h1>
        </div>
      </div>

      {/* W/D/L summary */}
      <div className="mb-8 grid grid-cols-5 gap-2 rounded-xl bg-[var(--color-surface)] p-4 text-center">
        <div>
          <p className="text-2xl font-bold text-kcvv-success">{summary.wins}</p>
          <p className="text-xs text-[var(--color-muted)]">W</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-kcvv-warning">
            {summary.draws}
          </p>
          <p className="text-xs text-[var(--color-muted)]">G</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-kcvv-alert">{summary.losses}</p>
          <p className="text-xs text-[var(--color-muted)]">V</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{summary.goalsFor}</p>
          <p className="text-xs text-[var(--color-muted)]">Doelpunten voor</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{summary.goalsAgainst}</p>
          <p className="text-xs text-[var(--color-muted)]">Doelpunten tegen</p>
        </div>
      </div>

      {/* Match list */}
      <h2 className="mb-3 text-lg font-semibold">
        {totalPlayed === 0
          ? "Alle wedstrijden"
          : `${matches.length} wedstrijd${matches.length !== 1 ? "en" : ""}`}
      </h2>
      <ul className="space-y-2">
        {matches.map((match) => {
          const result = getMatchResult(match);
          const homeScore = match.home_team.score;
          const awayScore = match.away_team.score;
          const hasScore = homeScore != null && awayScore != null;
          const borderClass = result ? resultBorderClass[result] : "";

          return (
            <li key={match.id}>
              <Link
                href={`/wedstrijd/${match.id}`}
                className={`flex items-center justify-between rounded-lg bg-[var(--color-surface)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)] ${borderClass}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[var(--color-muted)]">
                    {formatMatchDate(match.date)}
                    {match.competition ? ` · ${match.competition}` : ""}
                  </span>
                  <span className="text-sm font-medium">
                    {match.home_team.name} vs {match.away_team.name}
                  </span>
                  {match.kcvv_team_label && (
                    <span className="text-xs text-[var(--color-muted)]">
                      {match.kcvv_team_label}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {hasScore ? (
                    <span className="text-lg font-bold tabular-nums">
                      {homeScore} – {awayScore}
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--color-muted)]">
                      Gepland
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
