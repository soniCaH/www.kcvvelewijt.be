import type { Match } from "@/lib/effect/schemas";
import { matchRowKind, otherClubSide } from "@/lib/utils/match-display";
import { assertNever } from "@/lib/utils/assert-never";
import type { ScheduleRow, ScheduleTeam } from "./types";

/**
 * Transform a BFF `Match` into the `ScheduleRow` shape consumed by the
 * match-agenda components (`<TeamMatchesSection>` / `<TeamAgendaRow>`). Shared
 * by the team-detail pages, the opponent-history (`/tegenstander`) page, the
 * homepage `<FirstTeamsBlock>`, and the landing `<MatchStripView>`.
 *
 * Branches on `matchRowKind()` into the three `ScheduleRow` members
 * (#2688/#2802) — the contract itself stays sparse (`is_placeholder` is
 * `undefined` for an ordinary fixture, per #2606/#2632's review), but the
 * web view-model normalises that into a definite `kind` discriminant,
 * because the union needs a real discriminant to narrow on, not a tri-state
 * optional.
 *
 * `kind` is switched over explicitly (#2802 review) rather than three
 * cascading `if`s ending in a bare fallthrough `return` —
 * `apps/web/CLAUDE.md`'s exhaustiveness rule applies to picking a union
 * member just as much as to narrowing one: the `default: assertNever(kind)`
 * below is unreachable today, but it is what makes a fourth `kind` a
 * compile error here instead of a silently mis-shaped object.
 *
 * @param match - Match from PSD API via the BFF
 * @returns ScheduleRow object for display
 */
export function transformMatchToSchedule(match: Match): ScheduleRow {
  const kind = matchRowKind(match);

  switch (kind) {
    case "reservation":
      return {
        kind,
        id: match.id,
        date: match.date,
        time: match.time,
        team: transformTeam(match.home_team),
        status: match.status,
        competition: match.competition,
      };
    case "reduced":
      return {
        kind,
        id: match.id,
        date: match.date,
        time: match.time,
        team: transformTeam(otherClubSide(match.home_team, match.away_team)),
        status: match.status,
        competition: match.competition,
        competitionType: match.competitionType,
      };
    case "match":
      return {
        kind,
        id: match.id,
        date: match.date,
        time: match.time,
        homeTeam: transformTeam(match.home_team),
        awayTeam: transformTeam(match.away_team),
        homeScore: match.home_team.score,
        awayScore: match.away_team.score,
        status: match.status,
        competition: match.competition,
        competitionType: match.competitionType,
        isHome: match.is_home,
      };
    default:
      return assertNever(kind);
  }
}

function transformTeam(team: Match["home_team"]): ScheduleTeam {
  return {
    id: team.id,
    name: team.name,
    logo: team.logo,
    teamLabel: team.team_label,
  };
}
