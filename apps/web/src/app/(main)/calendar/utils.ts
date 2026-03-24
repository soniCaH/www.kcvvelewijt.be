/**
 * Calendar view-model utilities
 */

import type { Match } from "@/lib/effect/schemas/match.schema";
import type { MatchStatus } from "@/components/match/types";

export interface CalendarTeam {
  id: number;
  name: string;
  logo?: string;
}

export interface CalendarMatch {
  id: number;
  date: string;
  time?: string;
  homeTeam: CalendarTeam;
  awayTeam: CalendarTeam;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  competition?: string;
  team?: string;
}

export function transformMatchToCalendar(match: Match): CalendarMatch {
  return {
    id: match.id,
    date: match.date.toISOString(),
    time: match.time,
    homeTeam: {
      id: match.home_team.id,
      name: match.home_team.name,
      logo: match.home_team.logo,
    },
    awayTeam: {
      id: match.away_team.id,
      name: match.away_team.name,
      logo: match.away_team.logo,
    },
    homeScore: match.home_team.score,
    awayScore: match.away_team.score,
    status: match.status,
    competition: match.competition,
    team: match.kcvv_team_label,
  };
}
