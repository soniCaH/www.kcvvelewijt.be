import type {
  UpcomingMatch,
  UpcomingReducedMatch,
  UpcomingReservation,
  UpcomingRow,
} from "@/components/match/types";

const KCVV_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1";

const kcvv = (
  overrides: Partial<UpcomingMatch["homeTeam"]> = {},
): UpcomingMatch["homeTeam"] => ({
  id: 1235,
  name: "KCVV Elewijt",
  logo: KCVV_LOGO,
  ...overrides,
});

const opponent = (id: number, name: string): UpcomingMatch["homeTeam"] => ({
  id,
  name,
  logo: `https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/${id}.png?v=1`,
});

const makeMatch = (
  id: number,
  date: string,
  time: string,
  home: UpcomingMatch["homeTeam"],
  away: UpcomingMatch["homeTeam"],
  options: Partial<UpcomingMatch> = {},
): UpcomingMatch => ({
  kind: "match",
  id,
  date: new Date(date),
  time,
  homeTeam: home,
  awayTeam: away,
  status: "scheduled",
  competition: "3e Afdeling VV",
  kcvvTeamLabel: "A-Ploeg",
  ...options,
});

/**
 * The real production spelling (#2491, `apps/api/src/psd/venue.ts`'s
 * `CLUB_VENUE`) — a standalone literal, not imported from `apps/api` (a
 * different app), but deliberately the true 46-char string rather than a
 * shorter placeholder: a shorter mock would let this story (and its VR
 * baseline) understate how long the homepage caption actually gets on a
 * home fixture. Only home fixtures carry a venue at all.
 */
const HOME_VENUE = "Sportpark Elewijt, Driesstraat 32, 1982 Elewijt";

export const mockUpcomingFive: UpcomingMatch[] = [
  makeMatch(
    501,
    "2026-05-16T13:00:00Z",
    "15:00",
    kcvv(),
    opponent(59, "KVC Wilrijk"),
    { venue: HOME_VENUE },
  ),
  makeMatch(
    502,
    "2026-05-23T13:00:00Z",
    "15:00",
    opponent(628, "City Pirates"),
    kcvv(),
    { kcvvTeamLabel: "U21", competition: "Provinciaal U21" },
  ),
  makeMatch(
    503,
    "2026-05-30T13:00:00Z",
    "14:30",
    kcvv(),
    opponent(448, "FC Wezel Sport"),
    {
      kcvvTeamLabel: "B-Ploeg",
      competition: "4e Provinciale",
      venue: HOME_VENUE,
    },
  ),
  makeMatch(
    504,
    "2026-06-06T13:00:00Z",
    "15:00",
    opponent(756, "Verbroedering Hofstade-Zemst"),
    kcvv(),
  ),
  makeMatch(
    505,
    "2026-06-13T13:00:00Z",
    "10:30",
    kcvv(),
    opponent(230, "KCS Machelen"),
    {
      kcvvTeamLabel: "U17",
      competition: "Gewestelijke U17",
      venue: HOME_VENUE,
    },
  ),
];

export const mockUpcomingTwelve: UpcomingMatch[] = [
  ...mockUpcomingFive,
  makeMatch(
    506,
    "2026-06-20T13:00:00Z",
    "15:00",
    opponent(59, "KVC Wilrijk"),
    kcvv(),
  ),
  makeMatch(
    507,
    "2026-06-27T13:00:00Z",
    "14:00",
    kcvv(),
    opponent(628, "City Pirates"),
    {
      kcvvTeamLabel: "U15",
      competition: "Gewestelijke U15",
      venue: HOME_VENUE,
    },
  ),
  makeMatch(
    508,
    "2026-07-04T13:00:00Z",
    "15:00",
    kcvv(),
    opponent(448, "FC Wezel Sport"),
    { venue: HOME_VENUE },
  ),
  makeMatch(
    509,
    "2026-07-11T13:00:00Z",
    "13:00",
    opponent(756, "Verbroedering Hofstade-Zemst"),
    kcvv(),
    { kcvvTeamLabel: "U13", competition: "Provinciaal U13" },
  ),
  makeMatch(
    510,
    "2026-07-18T13:00:00Z",
    "15:00",
    kcvv(),
    opponent(230, "KCS Machelen"),
    { venue: HOME_VENUE },
  ),
  makeMatch(
    511,
    "2026-07-25T13:00:00Z",
    "15:00",
    opponent(59, "KVC Wilrijk"),
    kcvv(),
    { kcvvTeamLabel: "U21", competition: "Provinciaal U21" },
  ),
  makeMatch(
    512,
    "2026-08-01T13:00:00Z",
    "14:30",
    kcvv(),
    opponent(628, "City Pirates"),
    { venue: HOME_VENUE },
  ),
];

export const mockUpcomingThree: UpcomingMatch[] = mockUpcomingFive.slice(0, 3);

/**
 * Every fixture belongs to one squad — the end-of-season tail, when only the
 * A-team has games left. The team filter has nothing to choose between and
 * drops out entirely rather than rendering a single dead chip beside "Alles".
 */
export const mockUpcomingSingleTeam: UpcomingMatch[] =
  mockUpcomingTwelve.filter((m) => m.kcvvTeamLabel === "A-Ploeg");

/**
 * A youth tournament placeholder (#2606) — both sides upstream are the same
 * club. Renders as the reduced `<ReservationMatchRow>`: no opponent, no
 * link, the club crest and the subject via `reservationView()` instead of
 * "KCVV Elewijt — KCVV Elewijt" (#2688).
 */
const mockUpcomingReservation: UpcomingReservation = {
  kind: "reservation",
  id: 90,
  date: new Date("2026-05-09T09:30:00Z"),
  time: "09:30",
  team: kcvv(),
  status: "scheduled",
  competition: "Tornooi",
  kcvvTeamLabel: "U13",
};

export const mockUpcomingWithReservation: UpcomingRow[] = [
  ...mockUpcomingFive,
  mockUpcomingReservation,
];

/**
 * A tournament fixture with no result yet (#2696/#2802) — a real named
 * opponent, not a self-match. Renders the same reduced `<ReservationMatchRow>`
 * as a placeholder, but `team` is the *other* club (never KCVV's own): the
 * gap `<UpcomingMatchesClient>` had before this ticket — it never called
 * `isReducedMatchRow`, so a not-yet-played tournament fixture for a
 * non-senior team rendered the ordinary linked two-crest scoreboard here.
 */
const mockUpcomingTournament: UpcomingReducedMatch = {
  kind: "reduced",
  id: 91,
  // Dated earlier than every `mockUpcomingFive` fixture (earliest 05-16), so
  // it takes one of the 5 visible (collapsed) slots — mirroring
  // `mockUpcomingReservation`'s 05-09 date above.
  date: new Date("2026-05-10T09:30:00Z"),
  time: "09:30",
  team: opponent(1391, "FC Zemst Sportief"),
  status: "scheduled",
  competition: "Tornooi",
  competitionType: "tournament",
  kcvvTeamLabel: "U9",
};

export const mockUpcomingWithTournament: UpcomingRow[] = [
  ...mockUpcomingFive,
  mockUpcomingTournament,
];
