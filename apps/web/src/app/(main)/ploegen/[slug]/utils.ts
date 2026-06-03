/**
 * Shared utilities for team detail pages
 *
 * BFF transform functions only — Sanity transforms are now in TeamRepository.
 */

import type { Match } from "@/lib/effect/schemas";
import type { ScheduleMatch, ScheduleTeam } from "@/components/match/types";

/**
 * Transform a BFF Match into the `ScheduleMatch` shape consumed by the
 * Phase 6.C match-agenda components (`<TeamMatchesSection>` / `<TeamAgendaRow>`).
 *
 * @param match - Match from PSD API via BFF
 * @returns ScheduleMatch object for display
 */
export function transformMatchToSchedule(match: Match): ScheduleMatch {
  const transformTeam = (team: Match["home_team"]): ScheduleTeam => ({
    id: team.id,
    name: team.name,
    logo: team.logo,
    teamLabel: team.team_label,
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
