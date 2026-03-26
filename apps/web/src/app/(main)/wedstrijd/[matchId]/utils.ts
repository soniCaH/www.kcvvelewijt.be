/**
 * Utility functions for match detail pages
 */

import type {
  MatchDetail,
  MatchLineupPlayer,
} from "@/lib/effect/schemas/match.schema";
import type { MatchTeamProps } from "@/components/match/MatchHeader";
import type { LineupPlayer } from "@/components/match/MatchLineup";

/**
 * Convert a match's home team into props suitable for the MatchHeader component.
 *
 * @param match - The match detail containing the home team data
 * @returns The home team's `MatchTeamProps` with `name`, `logo`, and `score`
 */
export function transformHomeTeam(match: MatchDetail): MatchTeamProps {
  return {
    name: match.home_team.name,
    logo: match.home_team.logo,
    score: match.home_team.score,
  };
}

/**
 * Converts the match's away team data into props for the MatchHeader component.
 *
 * @returns An object containing the away team's name, logo, and score.
 */
export function transformAwayTeam(match: MatchDetail): MatchTeamProps {
  return {
    name: match.away_team.name,
    logo: match.away_team.logo,
    score: match.away_team.score,
  };
}

/**
 * Converts a MatchLineupPlayer into a LineupPlayer used by the MatchLineup component.
 *
 * @param player - The source player data to convert
 * @returns A LineupPlayer containing `id`, `name`, `number`, `minutesPlayed`, `isCaptain`, `status`, and `card` from `player`
 */
export function transformLineupPlayer(player: MatchLineupPlayer): LineupPlayer {
  return {
    id: player.id,
    name: player.name,
    number: player.number,
    minutesPlayed: player.minutesPlayed,
    isCaptain: player.isCaptain,
    status: player.status,
    card: player.card,
  };
}

/**
 * Returns the match time as "HH:MM" when available.
 *
 * If `match.time` is present it is returned; otherwise, if `match.date` is a Date with non-zero hours or minutes, the time extracted from that date is returned in 24-hour `HH:MM` format.
 *
 * @returns The time as `HH:MM` if available, `undefined` otherwise.
 */
export function extractMatchTime(match: MatchDetail): string | undefined {
  if (match.time) {
    return match.time;
  }

  // Try to extract time from date if it's a full datetime
  const date = match.date;
  if (date instanceof Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours !== 0 || minutes !== 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
  }

  return undefined;
}

/**
 * Builds an SEO-friendly match title.
 *
 * @returns `HomeTeam X - Y AwayTeam` if the match status is finished and both scores are present, otherwise `HomeTeam vs AwayTeam`
 */
export function formatMatchTitle(match: MatchDetail): string {
  const homeTeam = match.home_team.name;
  const awayTeam = match.away_team.name;

  // Only show score if match is finished AND both scores are defined
  if (
    (match.status === "finished" || match.status === "forfeited") &&
    match.home_team.score !== undefined &&
    match.away_team.score !== undefined
  ) {
    return `${homeTeam} ${match.home_team.score} - ${match.away_team.score} ${awayTeam}`;
  }

  return `${homeTeam} vs ${awayTeam}`;
}

/**
 * Build an SEO-friendly description for a match by combining its title, competition, and localized date.
 *
 * @param match - The match details used to generate the description
 * @returns A string in the form "<title> - <competition> op <date>" where `<date>` is formatted using the "nl-BE" locale with weekday, year, month, and day
 */
export function formatMatchDescription(match: MatchDetail): string {
  const title = formatMatchTitle(match);
  const competition = match.competition || "Wedstrijd";
  const dateStr = match.date.toLocaleDateString("nl-BE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `${title} - ${competition} op ${dateStr}`;
}
