import type { MatchStatus } from "@/lib/effect/schemas/match.schema";

interface HasScoreMatch {
  home_team: { score?: number };
  away_team: { score?: number };
  status: MatchStatus;
}

interface HasScoreNarrowed {
  home_team: { score: number };
  away_team: { score: number };
  status: MatchStatus;
}

export function hasScore(
  match: HasScoreMatch,
): match is HasScoreMatch & HasScoreNarrowed {
  return (
    (match.status === "finished" || match.status === "forfeited") &&
    typeof match.home_team.score === "number" &&
    typeof match.away_team.score === "number"
  );
}

export type ScoreDisplay =
  | { type: "score"; home: number; away: number }
  | { type: "vs" };

export function getScoreDisplay(match: HasScoreMatch): ScoreDisplay {
  if (hasScore(match)) {
    return {
      type: "score",
      home: match.home_team.score,
      away: match.away_team.score,
    };
  }
  return { type: "vs" };
}

export function getResultColor(
  homeScore: number,
  awayScore: number,
  isHome: boolean,
): "win" | "draw" | "loss" {
  if (homeScore === awayScore) return "draw";
  const homeWins = homeScore > awayScore;
  return homeWins === isHome ? "win" : "loss";
}

/**
 * Whether a match has been played (a score is meaningful). Shared by every row
 * that switches between a kickoff time and a scoreline + outcome underline
 * (`<TeamAgendaRow>`, the kalender agenda row) so the status set can't drift
 * between them.
 */
export function isPlayedMatch(status: MatchStatus): boolean {
  return (
    status === "finished" || status === "forfeited" || status === "stopped"
  );
}
