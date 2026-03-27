/**
 * Shared utilities for team detail pages
 *
 * BFF transform functions only — Sanity transforms are now in TeamRepository.
 */

import type { Match, RankingEntry } from "@/lib/effect/schemas";
import type {
  ScheduleMatch,
  ScheduleTeam,
} from "@/components/team/TeamSchedule";
import type { StandingsEntry } from "@/components/team/TeamStandings";

/**
 * Transform Footbalisto Match to ScheduleMatch for TeamSchedule component
 *
 * @param match - Match from Footbalisto API
 * @returns ScheduleMatch object for display
 */
export function transformMatchToSchedule(match: Match): ScheduleMatch {
  const transformTeam = (team: Match["home_team"]): ScheduleTeam => ({
    id: team.id,
    name: team.name,
    logo: team.logo,
  });

  return {
    id: match.id,
    date: match.date,
    time: match.time,
    homeTeam: transformTeam(match.home_team),
    awayTeam: transformTeam(match.away_team),
    homeScore: match.home_team.score,
    awayScore: match.away_team.score,
    status: match.status,
    competition: match.competition,
    isHome: match.is_home,
  };
}

/**
 * Convert a Footbalisto ranking entry into a StandingsEntry suitable for the TeamStandings UI.
 *
 * @param entry - Ranking entry object from the Footbalisto API
 * @returns A StandingsEntry containing position, team identifiers and display fields (teamId, teamName, teamLogo), match totals (played, won, drawn, lost), goal totals (goalsFor, goalsAgainst, goalDifference), and points
 */
export function transformRankingToStandings(
  entry: RankingEntry,
): StandingsEntry {
  return {
    position: entry.position,
    teamId: entry.team_id,
    teamName: entry.team_name,
    teamLogo: entry.team_logo,
    played: entry.played,
    won: entry.won,
    drawn: entry.drawn,
    lost: entry.lost,
    goalsFor: entry.goals_for,
    goalsAgainst: entry.goals_against,
    goalDifference: entry.goal_difference,
    points: entry.points,
  };
}
