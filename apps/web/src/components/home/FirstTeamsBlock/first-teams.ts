/**
 * Pure view-model derivation for the homepage "Eerste ploegen" block (#2211).
 *
 * From a senior team's full season feed (`BffService.getMatches(psdId)`),
 * derive its last result + next fixture, mirroring the split used on the
 * team-detail agenda (`TeamMatchesSection`): next = earliest `scheduled` with
 * `date >= now`; result = most recent `finished` match with `date < now`
 * (finished-only, matching `recentResults` + `computeOutcome` — forfeits /
 * abandoned matches aren't surfaced as a headline result). Kept free of React
 * so it can be unit-tested in isolation.
 */
import type { Match } from "@/lib/effect/schemas";
import { getResultColor } from "@/lib/utils/match-display";

export interface FirstTeamMatchTeam {
  name: string;
  logo?: string;
}

export type FirstTeamOutcome = "win" | "draw" | "loss" | null;

export interface FirstTeamResultVM {
  matchId: number;
  home: FirstTeamMatchTeam;
  away: FirstTeamMatchTeam;
  /** Present only for a played match with a recorded scoreline. */
  homeScore?: number;
  awayScore?: number;
  /** Whether KCVV played at home (BFF `is_home`). */
  isHome?: boolean;
  /** KCVV-perspective outcome — only set for `finished` matches with scores + a known side. */
  outcome: FirstTeamOutcome;
  date: Date;
  competition?: string;
}

export interface FirstTeamFixtureVM {
  matchId: number;
  opponent: FirstTeamMatchTeam;
  isHome?: boolean;
  date: Date;
  time?: string;
  competition?: string;
}

export interface FirstTeamInput {
  /** Display label, e.g. "A-ploeg". */
  label: string;
  /** Team slug, e.g. "a-ploeg" (drives the team-matches deep link). */
  slug: string;
  /** Division label, e.g. "3de Nationale". */
  division?: string;
}

export interface FirstTeamVM extends FirstTeamInput {
  result?: FirstTeamResultVM;
  fixture?: FirstTeamFixtureVM;
}

function pickLastResult(
  matches: readonly Match[],
  now: Date,
): Match | undefined {
  return matches
    .filter((m) => m.status === "finished" && m.date.getTime() < now.getTime())
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

function pickNextFixture(
  matches: readonly Match[],
  now: Date,
): Match | undefined {
  return matches
    .filter(
      (m) => m.status === "scheduled" && m.date.getTime() >= now.getTime(),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}

function toTeam(team: Match["home_team"]): FirstTeamMatchTeam {
  return team.logo ? { name: team.name, logo: team.logo } : { name: team.name };
}

function toResultVM(m: Match): FirstTeamResultVM {
  const homeScore = m.home_team.score;
  const awayScore = m.away_team.score;
  const isHome = m.is_home;
  const outcome: FirstTeamOutcome =
    m.status === "finished" &&
    typeof homeScore === "number" &&
    typeof awayScore === "number" &&
    isHome !== undefined
      ? getResultColor(homeScore, awayScore, isHome)
      : null;

  return {
    matchId: m.id,
    home: toTeam(m.home_team),
    away: toTeam(m.away_team),
    ...(typeof homeScore === "number" ? { homeScore } : {}),
    ...(typeof awayScore === "number" ? { awayScore } : {}),
    ...(isHome !== undefined ? { isHome } : {}),
    outcome,
    date: m.date,
    ...(m.competition ? { competition: m.competition } : {}),
  };
}

function toFixtureVM(m: Match): FirstTeamFixtureVM {
  // KCVV away → opponent is the home side; home / unknown → opponent is away.
  const opponent = m.is_home === false ? m.home_team : m.away_team;
  return {
    matchId: m.id,
    opponent: toTeam(opponent),
    ...(m.is_home !== undefined ? { isHome: m.is_home } : {}),
    date: m.date,
    ...(m.time ? { time: m.time } : {}),
    ...(m.competition ? { competition: m.competition } : {}),
  };
}

/**
 * Build the view-model for one senior team. Always returns the team identity;
 * `result` / `fixture` are present only when a match exists for that side.
 */
export function deriveFirstTeamVM(
  team: FirstTeamInput,
  matches: readonly Match[],
  now: Date,
): FirstTeamVM {
  const result = pickLastResult(matches, now);
  const fixture = pickNextFixture(matches, now);
  return {
    ...team,
    ...(result ? { result: toResultVM(result) } : {}),
    ...(fixture ? { fixture: toFixtureVM(fixture) } : {}),
  };
}
