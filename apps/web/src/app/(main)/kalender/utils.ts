/**
 * Calendar view-model utilities
 */

import { DateTime } from "luxon";
import type { Match } from "@/lib/effect/schemas/match.schema";
import type { MatchStatus } from "@/components/match/types";
import { getScoreDisplay, type ScoreDisplay } from "@/lib/utils/match-display";
export type { ScoreDisplay } from "@/lib/utils/match-display";

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
  scoreDisplay: ScoreDisplay;
  status: MatchStatus;
  competition?: string;
  team?: string;
  kcvvTeamId?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  href: string;
}

export interface CalendarTeamInfo {
  id: string;
  name: string;
  psdId: number;
  label: string;
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
    scoreDisplay: getScoreDisplay(match),
    status: match.status,
    competition: match.competition,
    team: match.kcvv_team_label,
    kcvvTeamId: match.kcvv_team_id,
  };
}

const TIMEZONE = "Europe/Brussels";

/** Parse an ISO string into the club's local timezone */
function toLocalDate(iso: string): DateTime {
  return DateTime.fromISO(iso, { zone: TIMEZONE });
}

/** Filter matches whose date falls on the given YYYY-MM-DD */
export function getMatchesForDay(
  matches: CalendarMatch[],
  day: string,
): CalendarMatch[] {
  return matches.filter((m) => {
    const dt = toLocalDate(m.date);
    return dt.isValid && dt.toISODate() === day;
  });
}

/** Filter events that span the given YYYY-MM-DD (single or multi-day) */
export function getEventsForDay(
  events: CalendarEvent[],
  day: string,
): CalendarEvent[] {
  return events.filter((e) => {
    const start = toLocalDate(e.dateStart);
    if (!start.isValid) return false;
    const startDay = start.toISODate()!;
    if (startDay === day) return true;
    if (!e.dateEnd) return false;
    const end = toLocalDate(e.dateEnd);
    return end.isValid && day >= startDay && day <= end.toISODate()!;
  });
}

/**
 * Returns YYYY-MM-DD strings for all day cells in a month grid.
 * Always starts on Monday and ends on Sunday, producing 35 or 42 cells.
 */
export function getDaysInMonth(year: number, month: number): string[] {
  const firstOfMonth = DateTime.local(year, month, 1);
  // ISO weekday: 1=Monday, 7=Sunday
  const startOffset = firstOfMonth.weekday - 1;
  const gridStart = firstOfMonth.minus({ days: startOffset });

  const daysInMonth = firstOfMonth.daysInMonth!;
  const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;

  const days: string[] = [];
  for (let i = 0; i < totalCells; i++) {
    days.push(gridStart.plus({ days: i }).toISODate()!);
  }
  return days;
}

/** Returns 7 YYYY-MM-DD strings (Mon-Sun) for the week containing `dateStr` */
export function getDaysInWeek(dateStr: string): string[] {
  const dt = DateTime.fromISO(dateStr);
  const monday = dt.startOf("week"); // Luxon weeks start on Monday by default
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(monday.plus({ days: i }).toISODate()!);
  }
  return days;
}

/** Determine if a match is home or away for KCVV */
export function getMatchDotType(match: CalendarMatch): "home" | "away" {
  if (match.kcvvTeamId != null) {
    return match.homeTeam.id === match.kcvvTeamId ? "home" : "away";
  }
  // Fallback for matches without kcvvTeamId
  return match.homeTeam.name.toLowerCase().includes("kcvv") ? "home" : "away";
}
