import type {
  CalendarReducedMatch,
  CalendarReservation,
} from "@/app/(main)/kalender/utils";
import { fixtureImage } from "@test-fixtures/images";

export const kcvv = {
  id: 1,
  name: "KCVV Elewijt A",
  logo: fixtureImage("sponsor-logo", 0),
};

export const opponent = {
  id: 2,
  name: "Racing Mechelen",
  logo: fixtureImage("sponsor-logo", 1),
};

export const tournamentOpponent = {
  id: 1391,
  name: "FC Zemst Sportief",
  logo: fixtureImage("sponsor-logo", 2),
};

/**
 * A youth tournament placeholder (#2606) — both sides are KCVV. Renders as
 * the reduced reservation row/card, no opponent, no link (#2688). Shared
 * across CalendarMonth/CalendarWeek/CalendarWidget's stories, which only
 * ever differ on `date` (each needs a date inside the range it renders) —
 * `isHome` is left unset deliberately: a reservation has no side to name.
 */
export function reservationMatch(
  overrides: Partial<CalendarReservation> = {},
): CalendarReservation {
  return {
    id: 90,
    kind: "reservation",
    date: "2026-03-15T09:30:00",
    time: "09:30",
    club: kcvv,
    status: "scheduled",
    competition: "Tornooi",
    team: "U8",
    ...overrides,
  };
}

/**
 * A tournament fixture (#2696/#2715/#2802) — `competitionType ===
 * "tournament"`, a real named opponent, not a self-match. Renders the same
 * reduced row/card as `reservationMatch()` above, but the crest and subject
 * name the opponent, not KCVV — `club` is precomputed via club-id equality
 * by `transformMatchToCalendar` (see `match-display.ts`'s `matchRowKind`
 * for the function deciding this member applies).
 */
export function tournamentMatch(
  overrides: Partial<CalendarReducedMatch> = {},
): CalendarReducedMatch {
  return {
    id: 91,
    kind: "reduced",
    date: "2026-08-30T09:30:00",
    time: "09:30",
    club: tournamentOpponent,
    status: "scheduled",
    competition: "Tornooi",
    competitionType: "tournament",
    team: "U9",
    ...overrides,
  };
}
