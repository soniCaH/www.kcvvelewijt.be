import type { PlayerTeamStats } from "@kcvv/api-contract";
import type { OutfieldStats } from "@/components/player/PlayerStats/PlayerStats";

export function toOutfieldPlayerStatsData(
  teams: readonly PlayerTeamStats[],
): OutfieldStats[] {
  return teams.map((t) => ({
    season: t.team,
    matches: t.gamesPlayed,
    goals: t.goals,
    assists: t.assists,
    yellowCards: t.yellowCards,
    redCards: t.redCards,
    minutesPlayed: t.minutes,
  }));
}
