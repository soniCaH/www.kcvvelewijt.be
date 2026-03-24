/**
 * Shared utilities for team detail pages
 */

import type { Match, RankingEntry } from "@/lib/effect/schemas";
import type {
  SanityStaffMember,
  SanityTeam,
} from "@/lib/effect/services/SanityService";
import type {
  ScheduleMatch,
  ScheduleTeam,
} from "@/components/team/TeamSchedule";
import type { StandingsEntry } from "@/components/team/TeamStandings";
import type { StaffMember } from "@/components/team/TeamRoster";

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

// ─── Sanity transform functions ──────────────────────────────────────────────

/**
 * Convert a Sanity staff member document into a StaffMember suitable for the team roster.
 *
 * @param member - The SanityStaffMember document to transform
 * @returns A StaffMember containing `id`, `firstName`, `lastName`, `role`, and `imageUrl` (or `undefined` if not present)
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
 * Select the most appropriate display tagline for a Sanity team.
 *
 * @param team - The Sanity team object to derive the tagline from; fields are checked in order of preference.
 * @returns The team's tagline, or the full division, or the division, whichever is available; `undefined` if none are present.
 */
export function getSanityTeamTagline(team: SanityTeam): string | undefined {
  return team.tagline ?? team.divisionFull ?? team.division ?? undefined;
}

/**
 * Determine whether a Sanity team represents a youth or senior team based on its age field.
 *
 * @param team - The Sanity team whose `age` field will be inspected
 * @returns `"youth"` if the `age` value starts with `U` or contains `jeugd` (case-insensitive), `"senior"` otherwise
 */
export function getSanityTeamType(team: SanityTeam): "youth" | "senior" {
  const age = team.age?.toLowerCase() ?? "";
  return age.startsWith("u") || age.includes("jeugd") ? "youth" : "senior";
}

/**
 * Extracts the age-group label (e.g., "U15", "U17A") from a Sanity team's age string.
 *
 * @param team - The Sanity team object containing an `age` field
 * @returns The age-group label in uppercase if present (such as `"U15"` or `"U17A"`), `undefined` otherwise
 */
export function getSanityAgeGroup(team: SanityTeam): string | undefined {
  if (!team.age) return undefined;
  const match = team.age.match(/U\d{1,2}[A-Z]?/i);
  return match ? match[0].toUpperCase() : undefined;
}
