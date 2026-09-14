import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchStripView } from "./MatchStripView";
import type {
  ScheduleMatch,
  ScheduleReducedMatch,
  ScheduleReservation,
} from "@/components/match/types";
import { KCVV_CLUB_ID } from "@/lib/constants";

const meta = {
  title: "Features/Matches/MatchStrip",
  component: MatchStripView,
  tags: ["autodocs", "vr"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MatchStripView>;

export default meta;
type Story = StoryObj<typeof meta>;

const KCVV = { id: KCVV_CLUB_ID, name: "KCVV Elewijt" };
const OPPONENT = {
  id: 9999,
  name: "RC Mechelen",
  logo: "/images/logos/kcvv-logo.png",
};

const homeWin: ScheduleMatch = {
  kind: "match",
  id: 12345,
  date: new Date("2026-08-03T15:00:00Z"),
  status: "finished",
  competition: "Tweede Provinciale A",
  homeTeam: KCVV,
  awayTeam: OPPONENT,
  homeScore: 3,
  awayScore: 1,
  isHome: true,
};

const awayFixture: ScheduleMatch = {
  kind: "match",
  id: 12346,
  date: new Date("2026-08-08T18:00:00Z"),
  time: "18:00",
  status: "scheduled",
  competition: "Beker van Vlaanderen",
  homeTeam: { id: 8888, name: "Boutersem United" },
  awayTeam: KCVV,
  isHome: false,
};

export const ResultAndFixture: Story = {
  args: { data: { result: homeWin, fixture: awayFixture } },
};

/**
 * #2616 — the dark jersey ground. The next fixture is today's, so the
 * fixture row/slide relabels to "Vandaag" with its kickoff and the whole
 * strip — including the still-listed last result — takes the dark ground,
 * per the checkpoint against `matchstrip-locked.md` (see the PR body): CTA
 * `inverted`, arrows/dividers/slide label to cream alphas, team names and
 * score to cream, the meta line to `warm`.
 *
 * No venue: `ScheduleMatch` carries no such field at all (#2398) — a
 * deliberate type-level omission, unaffected by the BFF sourcing `venue` for
 * other consumers since #2491 — so the strip never claims a ground.
 */
const todaysFixture: ScheduleMatch = {
  kind: "match",
  id: 12349,
  date: new Date("2026-08-15T15:00:00Z"),
  time: "15:00",
  status: "scheduled",
  competition: "Tweede Provinciale A",
  homeTeam: KCVV,
  awayTeam: { id: 7654, name: "KFC Hofstade" },
  isHome: true,
};

export const MatchDay: Story = {
  args: { data: { result: homeWin, fixture: todaysFixture }, matchDay: true },
};

/** Outside the 72h window, or at the start of a season — fixture only. */
export const FixtureOnly: Story = {
  args: { data: { result: null, fixture: awayFixture } },
};

/** End of season, or a mid-week result with nothing scheduled yet. */
export const ResultOnly: Story = {
  args: { data: { result: homeWin, fixture: null } },
};

/**
 * A draw carries its own ink-muted outcome sweep (#2512/#2656) — no longer
 * unmarked — and the mobile ledger's stub reads "Gelijk" instead of "Uitslag".
 */
export const Draw: Story = {
  args: {
    data: {
      result: { ...homeWin, homeScore: 2, awayScore: 2 },
      fixture: awayFixture,
    },
  },
};

/** Away loss: scoreboard order puts the opponent's goals first. */
export const AwayLoss: Story = {
  args: {
    data: {
      result: {
        ...homeWin,
        homeTeam: { id: 8888, name: "KVC Sint-Pieters-Leeuw United" },
        awayTeam: KCVV,
        homeScore: 2,
        awayScore: 0,
        isHome: false,
      },
      fixture: awayFixture,
    },
  },
};

/**
 * Kicked off, score not yet published (#2390). `pickLastResult` — shared with
 * the homepage block — now routes such a match to the result side, so the strip
 * shows a result whose scoreline does not exist yet and falls back to the
 * kickoff time. The desktop slider defaults to this slide, which is why the
 * fallback matters: without it the space between the crests is simply empty for
 * the hours after every kickoff.
 */
export const AwaitingResult: Story = {
  args: {
    data: {
      result: {
        ...homeWin,
        id: 12347,
        date: new Date("2026-08-06T17:30:00Z"),
        time: "19:30",
        status: "scheduled",
        homeScore: undefined,
        awayScore: undefined,
        awayTeam: { id: 7777, name: "FC Zemst Sportief" },
      },
      fixture: awayFixture,
    },
  },
};

/**
 * A pitch-reservation placeholder (#2606) as the next fixture — no opponent,
 * no score slot, no `Wedstrijddetails` CTA. Mirrors `<TeamAgendaRow>`'s
 * reduced treatment rather than inventing a second vocabulary (#2688).
 */
const reservation: ScheduleReservation = {
  kind: "reservation",
  id: 12348,
  date: new Date("2026-05-09T09:30:00Z"),
  time: "09:30",
  team: KCVV,
  status: "scheduled",
  competition: "Tornooi",
};

export const ReservationFixture: Story = {
  args: { data: { result: homeWin, fixture: reservation } },
};

/**
 * A tournament fixture with no result yet (#2696/#2802) as the next fixture
 * — the gap this ticket closes: `<MatchStripView>` never called
 * `isReducedMatchRow`, so this rendered the ordinary linked two-crest
 * scoreboard against a club PSD hasn't confirmed as a genuine opponent.
 * Same reduced treatment as `ReservationFixture` above, but the crest and
 * subject name the other club, not KCVV's own.
 */
const tournamentFixture: ScheduleReducedMatch = {
  kind: "reduced",
  id: 12349,
  date: new Date("2026-08-30T09:30:00Z"),
  time: "09:30",
  team: { id: 1391, name: "FC Zemst Sportief" },
  status: "scheduled",
  competition: "Tornooi",
  competitionType: "tournament",
};

export const TournamentFixture: Story = {
  args: { data: { result: homeWin, fixture: tournamentFixture } },
};

/** No opponent logo, no kickoff time, no competition — the fallback path. */
export const WithoutOptionalFields: Story = {
  args: {
    data: {
      result: null,
      fixture: {
        ...awayFixture,
        time: undefined,
        competition: undefined,
        homeTeam: { id: 8888, name: "VK De Volharding" },
      },
    },
  },
};
