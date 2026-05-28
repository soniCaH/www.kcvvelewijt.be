/**
 * Utility functions for match detail pages
 */

import type {
  MatchDetail,
  MatchLineupPlayer,
} from "@/lib/effect/schemas/match.schema";
import type { MatchHeroTeam } from "@/components/match/MatchHero";
import type { LineupPlayer } from "@/components/match/MatchLineup";

/**
 * Convert a match's home team into props suitable for the MatchHero component.
 *
 * @param match - The match detail containing the home team data
 * @returns The home team's `MatchHeroTeam` with `name`, `logo`, and `score`
 */
export function transformHomeTeam(match: MatchDetail): MatchHeroTeam {
  return {
    name: match.home_team.name,
    logo: match.home_team.logo,
    score: match.home_team.score,
  };
}

/**
 * Converts the match's away team data into props for the MatchHero component.
 *
 * @returns An object containing the away team's name, logo, and score.
 */
export function transformAwayTeam(match: MatchDetail): MatchHeroTeam {
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
 * Enrich a transformed `LineupPlayer` with `isKeeper`. The source depends on
 * which side of the match the player belongs to:
 *
 *   - **KCVV side**: look the player's PSD id up in the `keeperPsdIds` set
 *     sourced from Sanity `player.keeper` (PSD-synced, always reliable).
 *   - **Opponent side**: use the jersey #1 heuristic. PSD does not surface
 *     position data for opponent players in a match's lineup, and we don't
 *     mirror opponents in Sanity — so we fall back to the universal football
 *     convention that #1 is the keeper. Imperfect (~95% accurate) but
 *     consistent with how the rest of the BeNeLux football web reads
 *     opponent rosters.
 *
 * Two `undefined` cases force the jersey-#1 heuristic on **both** sides:
 *   1. `kcvvSide === undefined` — match data doesn't tell us which roster
 *      is KCVV (rare; legacy rows). Mis-applying Sanity flags to the wrong
 *      roster is worse than the heuristic.
 *   2. `keeperPsdIds === undefined` — the Sanity lookup failed. An empty
 *      Set would be indistinguishable from "Sanity said KCVV has no
 *      keepers" and would silently strip the KCVV keeper badge; an
 *      explicit `undefined` lets us route both sides through the
 *      heuristic on outage.
 */
export function enrichLineupWithKeeperFlag(
  player: LineupPlayer,
  side: "home" | "away",
  kcvvSide: "home" | "away" | undefined,
  keeperPsdIds: ReadonlySet<string> | undefined,
): LineupPlayer {
  const isKcvvSide = kcvvSide === side;
  const useSanityLookup = isKcvvSide && keeperPsdIds !== undefined;
  const isKeeper = useSanityLookup
    ? player.id !== undefined && keeperPsdIds.has(String(player.id))
    : player.number === 1;
  return { ...player, isKeeper };
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
