/**
 * Match Mappers
 * Transform match data between different formats
 */

import type { Match } from "@/lib/effect/schemas/match.schema";
import type { UpcomingMatch } from "@/components/match/types";

/**
 * Fix team name capitalization
 * API returns "Kcvv" but should be "KCVV"
 *
 * @param name - Team name from API
 * @returns Team name with proper capitalization
 */
function normalizeTeamName(name: string): string {
  return name.replace(/^Kcvv\b/i, "KCVV");
}

/**
 * Map Match (domain model) to UpcomingMatch (UI component format)
 *
 * @param match - Match data from domain layer
 * @returns UpcomingMatch object for UI consumption
 */
export function mapMatchToUpcomingMatch(match: Match): UpcomingMatch {
  return {
    id: match.id,
    date: match.date,
    time: match.time,
    venue: match.venue,
    homeTeam: {
      id: match.home_team.id,
      name: normalizeTeamName(match.home_team.name),
      logo: match.home_team.logo,
      score: match.home_team.score,
    },
    awayTeam: {
      id: match.away_team.id,
      name: normalizeTeamName(match.away_team.name),
      logo: match.away_team.logo,
      score: match.away_team.score,
    },
    status: match.status,
    round: match.round,
    competition: match.competition,
    kcvvTeamId: match.kcvv_team_id,
    kcvvTeamLabel: match.kcvv_team_label,
  };
}

/**
 * Map array of Matches to UpcomingMatches
 *
 * @param matches - Array of Match objects from domain layer
 * @returns Array of UpcomingMatch objects for UI consumption
 */
export function mapMatchesToUpcomingMatches(
  matches: readonly Match[],
): UpcomingMatch[] {
  return matches.map(mapMatchToUpcomingMatch);
}
