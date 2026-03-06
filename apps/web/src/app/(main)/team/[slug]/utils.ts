/**
 * Shared utilities for team detail pages
 */

import type {
  Player,
  Staff,
  Team,
  Match,
  RankingEntry,
} from "@/lib/effect/schemas";
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
 * Position mapping from Drupal codes to Dutch display names
 * Maps the short position codes (k, d, m, a, j) to full names
 */
const POSITION_MAP: Record<string, string> = {
  k: "Keeper",
  d: "Verdediger",
  m: "Middenvelder",
  a: "Aanvaller",
  j: "Speler", // Generic player (youth teams)
};

/**
 * Parse age group from team title or path
 *
 * Extracts age group identifier (e.g., U15, U21) from team name.
 *
 * @param team - Team entity
 * @returns Age group string if found (e.g., "U15", "U21"), undefined otherwise
 */
export function parseAgeGroup(team: Team): string | undefined {
  const title = team.attributes.title;

  // Match patterns like "U15", "U21", "U6", "U15A", etc.
  // \b at start for word boundary, then U followed by 1-2 digits
  // No trailing \b to allow "U15A" style patterns
  const match = title.match(/\bU(\d{1,2})/i);
  if (match) {
    return `U${match[1]}`;
  }

  // Also check path alias
  const alias = team.attributes.path?.alias || "";
  const pathMatch = alias.match(/\/u(\d{1,2})/i);
  if (pathMatch) {
    return `U${pathMatch[1]}`;
  }

  return undefined;
}

/**
 * Extract player image URL from resolved relationships
 *
 * @param player - Player entity with resolved image relationship
 * @returns Absolute image URL if available, undefined otherwise
 */
function getPlayerImageUrl(player: Player): string | undefined {
  const imageData = player.relationships.field_image?.data;
  if (imageData && "uri" in imageData) {
    return imageData.uri.url;
  }
  return undefined;
}

/**
 * Normalize position code to display name
 *
 * @param position - Drupal position code (k, d, m, a, j) or full name
 * @returns Normalized Dutch position name
 */
function normalizePosition(position: string | null | undefined): string {
  if (!position) return "Speler";

  // If it's already a full name, return as-is
  const knownPositions = Object.values(POSITION_MAP);
  if (knownPositions.includes(position)) {
    return position;
  }

  // Map short code to full name
  const normalized = POSITION_MAP[position.toLowerCase()];
  return normalized || position;
}

/**
 * Transform Drupal Player entity to RosterPlayer for TeamRoster component
 *
 * @param player - Player entity from Drupal
 * @returns RosterPlayer object for display
 */
export function transformPlayerToRoster(player: Player): RosterPlayer {
  const firstName = player.attributes.field_firstname || "";
  const lastName = player.attributes.field_lastname || "";
  const position = normalizePosition(player.attributes.field_position);
  const number = player.attributes.field_shirtnumber ?? undefined;
  const imageUrl = getPlayerImageUrl(player);
  const slug = player.attributes.path?.alias?.replace("/player/", "") || "";

  return {
    id: player.id,
    firstName,
    lastName,
    position,
    number,
    imageUrl,
    // href is required - use player ID as fallback if no slug
    href: slug ? `/players/${slug}` : `/players/${player.id}`,
  };
}

/**
 * Transform Drupal Player or Staff entity to StaffMember for TeamRoster component
 *
 * - Player entities acting as staff have their role in field_position_short (T1, T2, TK, …)
 * - Staff (node--staff) board members have their role in field_position_staff (full name)
 *
 * @param member - Player acting as staff, or a Staff board member
 * @returns StaffMember object for display
 */
export function transformStaffToMember(member: Player | Staff): StaffMember {
  const firstName = member.attributes.field_firstname || "";
  const lastName = member.attributes.field_lastname || "";
  const roleCode = member.attributes.field_position_short || undefined;
  const imageData = member.relationships.field_image?.data;
  const imageUrl =
    imageData && "uri" in imageData ? imageData.uri.url : undefined;

  // Board members (node--staff) expose a full role name via field_position_staff.
  // Coaching staff stored as node--player use the roleCode mapping instead.
  const roleMap: Record<string, string> = {
    T1: "Hoofdtrainer",
    T2: "Assistent-trainer",
    TK: "Keeperstrainer",
    TVJO: "Technisch Verantwoordelijke Jeugdopleiding",
    PDG: "Ploegdelegatie",
    AF: "Afgevaardigde",
    CO: "Coach",
  };

  const role =
    member.type === "node--staff" && member.attributes.field_position_staff
      ? member.attributes.field_position_staff
      : roleCode
        ? roleMap[roleCode] || roleCode
        : "Staff";

  return {
    id: member.id,
    firstName,
    lastName,
    role,
    roleCode,
    imageUrl,
  };
}

/**
 * Determine team type from team data
 *
 * @param team - Team entity
 * @returns "youth" for youth teams (with age group), "senior" otherwise
 */
export function getTeamType(team: Team): "youth" | "senior" {
  const ageGroup = parseAgeGroup(team);
  if (ageGroup) return "youth";

  // Check title for common senior team patterns
  const title = team.attributes.title.toLowerCase();
  if (
    title.includes("eerste ploeg") ||
    title.includes("1e ploeg") ||
    title.includes("a-ploeg")
  ) {
    return "senior";
  }

  return "senior";
}

/**
 * Get team tagline, falling back to division info
 *
 * @param team - Team entity
 * @returns Tagline or division name if available
 */
export function getTeamTagline(team: Team): string | undefined {
  if (team.attributes.field_tagline) {
    return team.attributes.field_tagline;
  }
  if (team.attributes.field_division_full) {
    return team.attributes.field_division_full;
  }
  if (team.attributes.field_division) {
    return team.attributes.field_division;
  }
  return undefined;
}

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
