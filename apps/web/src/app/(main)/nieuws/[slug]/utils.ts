/**
 * Helpers for the article detail page (`/nieuws/[slug]`). Kept out of
 * `page.tsx` so the pure mappers are unit-testable without pulling in the
 * server-only Effect runtime / repositories.
 */
import type { MatchDetail } from "@kcvv/api-contract";
import type { HeroMatchData } from "@/components/article/EditorialHero";
import { KCVV_CLUB_ID } from "@/lib/constants";
import { formatWidgetDate } from "@/lib/utils/dates";
import { extractMatchTime } from "@/lib/utils/match-time";

/**
 * Map the BFF `MatchDetail` onto the score-forward hero's `HeroMatchData`
 * (5.d-mat). KCVV side is id-driven, never name-based (see
 * `feedback_psd_match_identification`):
 *   1. prefer the team-scoped `is_home` flag when present, but
 *   2. `getMatchDetail` has no teamId context and leaves `is_home` null, so
 *      fall back to matching the KCVV club id against the two sides' ids.
 * Without (2) the KCVV crest ring + Doelpunten highlight would never render
 * on the real article page (the flag is only ever set by `/matches/*`).
 */
export function toHeroMatchData(match: MatchDetail): HeroMatchData {
  const kcvvSide =
    match.is_home === true
      ? "home"
      : match.is_home === false
        ? "away"
        : match.home_team.id === KCVV_CLUB_ID
          ? "home"
          : match.away_team.id === KCVV_CLUB_ID
            ? "away"
            : undefined;
  return {
    homeTeam: { name: match.home_team.name, logo: match.home_team.logo },
    awayTeam: { name: match.away_team.name, logo: match.away_team.logo },
    kcvvSide,
    homeScore: match.home_team.score,
    awayScore: match.away_team.score,
    kickoffTime: extractMatchTime(match),
    status: match.status,
    competition: match.competition,
    matchDate: formatWidgetDate(match.date),
  };
}
