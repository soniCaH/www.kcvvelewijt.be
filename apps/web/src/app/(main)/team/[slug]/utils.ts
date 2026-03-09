/**
 * Shared utilities for team detail pages
 */

import type { Match, RankingEntry } from "@/lib/effect/schemas";
import type {
  SanityPlayer,
  SanityStaffMember,
  SanityTeam,
} from "@/lib/effect/services/SanityService";
import type {
  ScheduleMatch,
  ScheduleTeam,
} from "@/components/team/TeamSchedule";
import type { StandingsEntry } from "@/components/team/TeamStandings";
import type { RosterPlayer, StaffMember } from "@/components/team/TeamRoster";

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
  };
}

/**
 * Transform Footbalisto RankingEntry to StandingsEntry for TeamStandings component
 *
 * @param entry - Ranking entry from Footbalisto API
 * @returns StandingsEntry object for display
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

// ─── Sanity transform functions ──────────────────────────────────────────────

/**
 * Transform SanityPlayer to RosterPlayer for TeamRoster component
 */
export function transformSanityPlayerToRoster(
  player: SanityPlayer,
): RosterPlayer {
  const position = player.keeper
    ? "Keeper"
    : (player.position ?? player.positionPsd ?? "Speler");
  return {
    id: player._id,
    firstName: player.firstName ?? "",
    lastName: player.lastName ?? "",
    position,
    number: player.jerseyNumber ?? undefined,
    imageUrl: player.transparentImageUrl ?? player.psdImageUrl ?? undefined,
    href: `/players/${player.psdId}`,
  };
}

/**
 * Transform SanityStaffMember to StaffMember for TeamRoster component
 */
export function transformSanityStaffToMember(
  member: SanityStaffMember,
): StaffMember {
  return {
    id: member._id,
    firstName: member.firstName,
    lastName: member.lastName,
    role: member.role,
    imageUrl: member.photoUrl ?? undefined,
  };
}

/**
 * Get team tagline from Sanity team (tagline → divisionFull → division)
 */
export function getSanityTeamTagline(team: SanityTeam): string | undefined {
  return team.tagline ?? team.divisionFull ?? team.division ?? undefined;
}

/**
 * Derive team type from Sanity team age field
 */
export function getSanityTeamType(team: SanityTeam): "youth" | "senior" {
  const age = team.age?.toLowerCase() ?? "";
  return age.startsWith("u") || age.includes("jeugd") ? "youth" : "senior";
}

/**
 * Derive age group label from Sanity team age field (e.g. "U15", "U17A")
 */
export function getSanityAgeGroup(team: SanityTeam): string | undefined {
  if (!team.age) return undefined;
  const match = team.age.match(/U\d{1,2}[A-Z]?/i);
  return match ? match[0].toUpperCase() : undefined;
}
