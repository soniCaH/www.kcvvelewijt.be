import type {
  Match,
  MatchDetail,
  MatchLineupPlayer,
  RankingEntry,
  CardType,
  TeamStats,
} from "@kcvv/api-contract";
import type {
  FootbalistoMatch,
  FootbalistoLineupPlayer,
  FootbalistoMatchEvent,
  FootbalistoMatchDetailResponse,
  FootbalistoRankingEntry,
  PsdGame,
  PsdTeamStatsResponse,
} from "./schemas";

type MatchStatusType =
  | "scheduled"
  | "finished"
  | "forfeited"
  | "postponed"
  | "stopped";

/**
 * Map PSD numeric game status + goal presence to a normalized MatchStatus.
 *
 * PSD status codes (empirically derived — not documented in API spec):
 *   0 = no special status; "finished" when goals are set, "scheduled" otherwise
 *   1 = FF  (forfait)            → "forfeited"
 *   2 = AFG (afgelast)           → "postponed"  (may be rescheduled)
 *   3 = STOP (ended prematurely) → "stopped"    (may be rescheduled)
 *
 * The `cancelled` boolean takes full precedence — if true, status is always "postponed"
 * regardless of the numeric code (unknown codes are still logged in that path).
 * Any unknown code (when not cancelled) falls back to "scheduled" (safe default).
 * Unknown codes are logged so we can detect undocumented PSD values in production.
 */
function mapGameStatus(
  status: number,
  goalsHome: number | null,
  goalsAway: number | null,
  cancelled?: boolean | null,
): MatchStatusType {
  // The `cancelled` boolean takes precedence over all numeric codes —
  // a game can be cancelled regardless of its status field value.
  if (cancelled) {
    if (status !== 0 && status !== 1 && status !== 2 && status !== 3) {
      console.warn(`[transforms] Unknown PSD game status code: ${status}`);
    }
    return "postponed";
  }
  if (status === 1) return "forfeited";
  if (status === 2) return "postponed";
  if (status === 3) return "stopped";
  if (status === 0) {
    return goalsHome !== null && goalsAway !== null ? "finished" : "scheduled";
  }
  // Unknown status — log and fall back to scheduled
  console.warn(`[transforms] Unknown PSD game status code: ${status}`);
  return "scheduled";
}

function parseDateString(dateStr: string): { date: Date; time: string } {
  const [datePart, timePart = "00:00"] = dateStr.split(" ");
  const [year, month, day] = datePart!.split("-").map(Number);
  const [hour = 0, minute = 0] = timePart.split(":").map(Number);
  return {
    date: new Date(Date.UTC(year!, month! - 1, day!, hour, minute)),
    time: timePart,
  };
}

/**
 * Transform a PSD game object (from /games/team/{teamId}/seasons/{seasonId})
 * to the normalized Match shape. Handles PSD-specific field differences:
 * - competitionType is an object; extract .type string
 * - time is a separate field from date; combine for accurate kickoff time
 * - homeTeam/awayTeam are ref objects; fall back to homeClub/awayClub ids
 */
export function transformPsdGame(game: PsdGame): Match {
  const datePart = game.date.split(" ")[0]!;
  const timeStr = game.time ?? game.date.split(" ")[1] ?? "00:00";
  const { date: matchDate, time: timePart } = parseDateString(
    `${datePart} ${timeStr}`,
  );
  const status = mapGameStatus(
    game.status,
    game.goalsHomeTeam,
    game.goalsAwayTeam,
    game.cancelled,
  );

  let roundLabel: string | undefined;
  if (game.teamId === 1) roundLabel = "A-ploeg";
  else if (game.teamId === 2) roundLabel = "B-ploeg";

  return {
    id: game.id,
    date: matchDate,
    time: timePart,
    venue: undefined,
    home_team: {
      id: game.homeClub.id,
      name: game.homeClub.name,
      logo: game.homeClub.logo ?? undefined,
      score: game.goalsHomeTeam ?? undefined,
    },
    away_team: {
      id: game.awayClub.id,
      name: game.awayClub.name,
      logo: game.awayClub.logo ?? undefined,
      score: game.goalsAwayTeam ?? undefined,
    },
    status,
    round: roundLabel,
    competition: game.competitionType?.type ?? "UNKNOWN",
  };
}

export function transformFootbalistoMatch(fbMatch: FootbalistoMatch): Match {
  const { date: matchDate, time: timePart } = parseDateString(fbMatch.date);
  const status = mapGameStatus(
    fbMatch.status,
    fbMatch.goalsHomeTeam,
    fbMatch.goalsAwayTeam,
    fbMatch.cancelled,
  );

  let roundLabel: string | undefined = fbMatch.age
    ? `${fbMatch.age}`
    : undefined;
  if (fbMatch.teamId === 1) roundLabel = "A-ploeg";
  else if (fbMatch.teamId === 2) roundLabel = "B-ploeg";

  return {
    id: fbMatch.id,
    date: matchDate,
    time: timePart,
    venue: undefined,
    home_team: {
      id: fbMatch.homeTeamId ?? fbMatch.homeClub.id,
      name: fbMatch.homeClub.name,
      logo: fbMatch.homeClub.logo ?? undefined,
      score: fbMatch.goalsHomeTeam ?? undefined,
    },
    away_team: {
      id: fbMatch.awayTeamId ?? fbMatch.awayClub.id,
      name: fbMatch.awayClub.name,
      logo: fbMatch.awayClub.logo ?? undefined,
      score: fbMatch.goalsAwayTeam ?? undefined,
    },
    status,
    round: roundLabel,
    competition: fbMatch.competitionType,
  };
}

function transformLineupStatus(
  status?: string,
  changed?: boolean,
): "starter" | "substitute" | "substituted" | "subbed_in" | "unknown" {
  if (status === "basis") return changed ? "substituted" : "starter";
  if (status === "invaller" || status === "bank")
    return changed ? "subbed_in" : "substitute";
  if (status === "wissel") return "substituted";
  return "unknown";
}

function transformLineupPlayer(
  player: FootbalistoLineupPlayer,
): MatchLineupPlayer {
  return {
    id: player.playerId ?? undefined,
    name: player.playerName,
    number: player.number ?? undefined,
    minutesPlayed: player.minutesPlayed ?? undefined,
    isCaptain: player.captain ?? false,
    status: transformLineupStatus(player.status, player.changed),
  };
}

function parseCardType(event: FootbalistoMatchEvent): CardType | undefined {
  const type = event.action.type.toUpperCase();
  const subtype = event.action.subtype?.toLowerCase();
  if (type !== "CARD") return undefined;
  switch (subtype) {
    case "yellow":
    case "geel":
      return "yellow";
    case "red":
    case "rood":
      return "red";
    case "double_yellow":
    case "yellowred":
    case "tweedegeel":
    case "tweede_geel":
      return "double_yellow";
    default:
      return undefined;
  }
}

function buildPlayerCardMap(
  events: readonly FootbalistoMatchEvent[],
): Map<number, CardType> {
  const cardMap = new Map<number, CardType>();
  for (const event of events) {
    const cardType = parseCardType(event);
    const playerId = event.playerId;
    if (cardType && playerId != null) {
      const existing = cardMap.get(playerId);
      if (existing === "yellow" && cardType === "yellow") {
        cardMap.set(playerId, "double_yellow");
      } else if (cardType === "red" || cardType === "double_yellow") {
        cardMap.set(playerId, cardType);
      } else if (!existing) {
        cardMap.set(playerId, cardType);
      }
    }
  }
  return cardMap;
}

function transformPlayerWithCard(
  player: FootbalistoLineupPlayer,
  cardMap: Map<number, CardType> | null,
): MatchLineupPlayer {
  const base = transformLineupPlayer(player);
  const card = cardMap && base.id ? cardMap.get(base.id) : undefined;
  return card ? { ...base, card } : base;
}

export function transformFootbalistoMatchDetail(
  response: FootbalistoMatchDetailResponse,
): MatchDetail {
  const general = response.general;
  const { date: matchDate, time: timePart } = parseDateString(general.date);
  const status = mapGameStatus(
    general.status,
    general.goalsHomeTeam,
    general.goalsAwayTeam,
    general.cancelled,
  );
  const cardMap = response.events ? buildPlayerCardMap(response.events) : null;

  let lineup:
    | { home: MatchLineupPlayer[]; away: MatchLineupPlayer[] }
    | undefined;
  if (response.lineup || response.substitutes) {
    lineup = {
      home: [
        ...(response.lineup?.home ?? []).map((p) =>
          transformPlayerWithCard(p, cardMap),
        ),
        ...(response.substitutes?.home ?? []).map((p) =>
          transformPlayerWithCard(p, cardMap),
        ),
      ],
      away: [
        ...(response.lineup?.away ?? []).map((p) =>
          transformPlayerWithCard(p, cardMap),
        ),
        ...(response.substitutes?.away ?? []).map((p) =>
          transformPlayerWithCard(p, cardMap),
        ),
      ],
    };
  }

  return {
    id: general.id,
    date: matchDate,
    time: timePart,
    venue: undefined,
    home_team: {
      id: general.homeClub.id,
      name: general.homeClub.name,
      logo: general.homeClub.logo ?? undefined,
      score: general.goalsHomeTeam ?? undefined,
    },
    away_team: {
      id: general.awayClub.id,
      name: general.awayClub.name,
      logo: general.awayClub.logo ?? undefined,
      score: general.goalsAwayTeam ?? undefined,
    },
    status,
    competition: general.competitionType,
    lineup,
    hasReport: general.viewGameReport,
  };
}

/** Strip lineup from a MatchDetail to produce a basic Match */
export function matchDetailToMatch(detail: MatchDetail): Match {
  return {
    id: detail.id,
    date: detail.date,
    time: detail.time,
    venue: detail.venue,
    home_team: detail.home_team,
    away_team: detail.away_team,
    status: detail.status,
    round: detail.round,
    competition: detail.competition,
  };
}

/**
 * Transform PSD /statistics/team response to normalized TeamStats.
 * Team totals (wins/draws/losses) are derived from the player with the most
 * gamesPlayed — they represent the team's full season record.
 * goalsScored/goalsAgainst are arrays of goal events; use .length for totals.
 */
export function transformPsdTeamStats(
  teamId: number,
  response: PsdTeamStatsResponse,
): typeof TeamStats.Type {
  const players = response.squadPlayerStatistics;

  const representative =
    players.length > 0
      ? players.reduce((best, p) =>
          p.gamesPlayed > best.gamesPlayed ? p : best,
        )
      : undefined;

  const cleanSheets =
    players.length > 0 ? Math.max(...players.map((p) => p.cleanSheets)) : 0;

  const topScorers = players
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .map((p) => ({
      player_id: p.playerId,
      player_name: `${p.firstName} ${p.lastName}`,
      team_id: teamId,
      matches_played: p.gamesPlayed,
      goals: p.goals,
      assists: p.assists ?? undefined,
      yellow_cards: p.yellowCards,
      red_cards: p.redCards,
      minutes_played: p.minutes ?? undefined,
    }));

  return {
    team_id: teamId,
    team_name: representative?.team ?? "KCVV",
    total_matches: representative?.gamesPlayed ?? 0,
    wins: representative?.gamesWon ?? 0,
    draws: representative?.gamesEqual ?? 0,
    losses: representative?.gamesLost ?? 0,
    goals_scored: response.goalsScored.length,
    goals_conceded: response.goalsAgainst.length,
    clean_sheets: cleanSheets > 0 ? cleanSheets : undefined,
    top_scorers: topScorers.length > 0 ? topScorers : undefined,
  };
}

export function transformFootbalistoRankingEntry(
  entry: FootbalistoRankingEntry,
  logoCdnUrl: string,
): RankingEntry {
  const cdn = logoCdnUrl.replace(/\/+$/, "");
  const teamName =
    entry.team.club.localName || entry.team.club.name || "Unknown Team";
  return {
    position: entry.rank,
    team_id: entry.team.id,
    team_name: teamName,
    team_logo: `${cdn}/extra_groot/${entry.team.club.id}.png`,
    played: entry.matchesPlayed,
    won: entry.wins,
    drawn: entry.draws,
    lost: entry.losses,
    goals_for: entry.goalsScored,
    goals_against: entry.goalsConceded,
    goal_difference: entry.goalsScored - entry.goalsConceded,
    points: entry.points,
    form: undefined,
  };
}
