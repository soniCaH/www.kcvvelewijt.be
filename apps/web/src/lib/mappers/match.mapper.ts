/**
 * Match Mappers
 * Transform match data between different formats
 */

import type { Match } from "@/lib/effect/schemas/match.schema";
import { matchRowKind, otherClubSide } from "@/lib/utils/match-display";
import { assertNever } from "@/lib/utils/assert-never";
import type { UpcomingRow } from "@/components/match/types";

/**
 * Map Match (domain model) to the homepage other-teams agenda's row shape.
 *
 * Branches on `matchRowKind()` (#2606/#2696) into the three `UpcomingRow`
 * members (#2688/#2802) — a pitch reservation has no opponent to map onto
 * `homeTeam`/`awayTeam`, so building one unconditionally rendered
 * "KCVV Elewijt — KCVV Elewijt" on `<UpcomingMatchesClient>`, the surface
 * most likely to carry one (it renders exactly the non-senior/youth
 * matches, and youth tournaments are where reservations come from). A
 * tournament fixture with no result yet gets the same reduced treatment for
 * the same reason every other renderer of this predicate does —
 * `<UpcomingMatchesClient>` had no such branch before this ticket.
 *
 * `kind` is switched over explicitly (#2802 review) — see
 * `transformMatchToSchedule`'s docblock in `@/components/match/transform`
 * for why the `default: assertNever(kind)` below is load-bearing, not
 * ceremony.
 *
 * @param match - Match data from domain layer
 * @returns UpcomingRow object for UI consumption
 */
export function mapMatchToUpcomingMatch(match: Match): UpcomingRow {
  const kind = matchRowKind(match);

  switch (kind) {
    case "reservation":
      return {
        kind,
        id: match.id,
        date: match.date,
        time: match.time,
        venue: match.venue,
        team: {
          id: match.home_team.id,
          name: match.home_team.name,
          logo: match.home_team.logo,
        },
        status: match.status,
        competition: match.competition,
        squadLabel: match.squadLabel,
        kcvvTeamLabel: match.kcvv_team_label,
      };
    case "reduced": {
      const other = otherClubSide(match.home_team, match.away_team);
      return {
        kind,
        id: match.id,
        date: match.date,
        time: match.time,
        venue: match.venue,
        team: { id: other.id, name: other.name, logo: other.logo },
        status: match.status,
        competition: match.competition,
        competitionType: match.competitionType,
        squadLabel: match.squadLabel,
        kcvvTeamLabel: match.kcvv_team_label,
      };
    }
    case "match":
      return {
        kind,
        id: match.id,
        date: match.date,
        time: match.time,
        venue: match.venue,
        homeTeam: {
          id: match.home_team.id,
          name: match.home_team.name,
          logo: match.home_team.logo,
          score: match.home_team.score,
        },
        awayTeam: {
          id: match.away_team.id,
          name: match.away_team.name,
          logo: match.away_team.logo,
          score: match.away_team.score,
        },
        status: match.status,
        squadLabel: match.squadLabel,
        competition: match.competition,
        kcvvTeamId: match.kcvv_team_id,
        kcvvTeamLabel: match.kcvv_team_label,
      };
    default:
      return assertNever(kind);
  }
}

/**
 * Map array of Matches to UpcomingRows
 *
 * @param matches - Array of Match objects from domain layer
 * @returns Array of UpcomingRow objects for UI consumption
 */
export function mapMatchesToUpcomingMatches(
  matches: readonly Match[],
): UpcomingRow[] {
  return matches.map(mapMatchToUpcomingMatch);
}
