import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchHero } from "./MatchHero";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Matches/MatchHero",
  component: MatchHero,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft min-h-[400px] p-10">
        <div className="mx-auto max-w-[760px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof MatchHero>;

export default meta;
type Story = StoryObj<typeof meta>;

const KCVV_LOGO = fixtureImage("sponsor-logo", 0);
const OPPONENT_LOGO = fixtureImage("sponsor-logo", 1);

const defaultHomeTeam = {
  id: 1235,
  name: "KCVV Elewijt",
  logo: KCVV_LOGO,
};
const defaultAwayTeam = {
  id: 9999,
  name: "RC Mechelen",
  logo: OPPONENT_LOGO,
};

const upcomingDate = new Date("2025-09-13T13:30:00Z");
const finishedDate = new Date("2025-09-06T13:30:00Z");

const baseMatch = {
  kind: "match",
  homeTeam: defaultHomeTeam,
  awayTeam: defaultAwayTeam,
  date: upcomingDate,
  time: "14:30",
  venue: "Sportpark Elewijt",
  competition: "3e provinciale A",
  kcvvTeamLabel: "KCVV-A",
} as const;

export const Upcoming: Story = {
  args: { match: { ...baseMatch, status: "scheduled" } },
};

export const Finished: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: { ...defaultHomeTeam, score: 3 },
      awayTeam: { ...defaultAwayTeam, score: 1 },
      status: "finished",
    },
  },
};

export const Forfeited: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: { ...defaultHomeTeam, score: 5 },
      awayTeam: { ...defaultAwayTeam, score: 0 },
      status: "forfeited",
    },
  },
};

export const Postponed: Story = {
  args: { match: { ...baseMatch, status: "postponed" } },
};

export const Cancelled: Story = {
  args: { match: { ...baseMatch, status: "cancelled" } },
};

export const Stopped: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: { ...defaultHomeTeam, score: 1 },
      awayTeam: { ...defaultAwayTeam, score: 1 },
      status: "stopped",
    },
  },
};

export const LongTeamNames: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: {
        id: defaultHomeTeam.id,
        name: "KFC Sint-Stevens-Woluwe-Diegem",
        logo: defaultHomeTeam.logo,
        score: 2,
      },
      awayTeam: {
        id: defaultAwayTeam.id,
        name: "Royal Antwerpen-Borgerhout SK",
        logo: defaultAwayTeam.logo,
        score: 2,
      },
      status: "finished",
    },
  },
};

export const NoLogos: Story = {
  args: {
    match: {
      ...baseMatch,
      homeTeam: { id: defaultHomeTeam.id, name: "KCVV Elewijt" },
      awayTeam: { id: defaultAwayTeam.id, name: "RC Mechelen" },
      status: "scheduled",
    },
  },
};

export const MinimalData: Story = {
  args: {
    match: {
      kind: "match",
      homeTeam: defaultHomeTeam,
      awayTeam: defaultAwayTeam,
      date: upcomingDate,
      status: "scheduled",
    },
  },
};

/**
 * A pitch-reservation placeholder (#2606) — both sides upstream are the same
 * club. One crest, no "vs" a second one, no score region: the subject
 * ("Tornooi") and real kickoff replace the competition/score vocabulary,
 * and the meta line names the squad that reserved the slot (#2688).
 *
 * The fullest layout is the only one kept: the defensive no-competition
 * fallback and the no-squad-label variant differ from this one only in the
 * meta line's text, which `MatchHero.test.tsx` already pins at the unit
 * level — a pixel diff cannot uniquely surface a string variant, so a
 * separate baseline for each was three VR captures for one component.
 */
export const Reservation: Story = {
  args: {
    match: {
      kind: "reservation",
      team: defaultHomeTeam,
      date: upcomingDate,
      time: "09:30",
      venue: "Sportpark Elewijt",
      competition: "Tornooi",
      kcvvTeamLabel: "U13",
      status: "scheduled",
    },
  },
};

/**
 * A tournament fixture with no result yet (#2696/#2802) — a real named
 * opponent, not a self-match. Same one-crest reduced register as
 * `Reservation` above, but the subject names the other club ("TORNOOI · FC
 * ZEMST SPORTIEF") and the crest is the opponent's, resolved by club id —
 * the gap this ticket closes: before it, `/wedstrijd/[matchId]` rendered an
 * ordinary two-crest "vs" scoreboard against a club PSD hasn't confirmed as
 * a genuine opponent.
 */
export const TournamentPending: Story = {
  args: {
    match: {
      kind: "reduced",
      team: { id: 1391, name: "FC Zemst Sportief" },
      date: upcomingDate,
      time: "09:30",
      venue: "Sportpark Elewijt",
      competition: "Tornooi",
      kcvvTeamLabel: "U9",
      status: "scheduled",
    },
  },
};

/**
 * The same tournament fixture once a result exists (#2696 review) — the
 * named club really was the opponent, so the hero reverts to the ordinary
 * two-crest scoreboard instead of staying reduced.
 */
export const TournamentPlayed: Story = {
  args: {
    match: {
      kind: "match",
      homeTeam: { ...defaultHomeTeam, score: 4 },
      awayTeam: { id: 1391, name: "FC Zemst Sportief", score: 1 },
      date: finishedDate,
      venue: "Sportpark Elewijt",
      competition: "Tornooi",
      kcvvTeamLabel: "U9",
      status: "finished",
    },
  },
};

/**
 * Mobile collapse — at narrow widths the two-zone grid stacks vertically,
 * the divider rotates from vertical-right to horizontal-bottom, and the
 * status badge stays anchored to the card's top-right.
 */
export const MobileCollapse: Story = {
  args: {
    match: {
      ...baseMatch,
      date: finishedDate,
      homeTeam: { ...defaultHomeTeam, score: 3 },
      awayTeam: { ...defaultAwayTeam, score: 1 },
      status: "finished",
    },
  },
  parameters: {
    // Locks the stacked-grid collapse, which only shows at narrow widths
    // (#2803).
    vr: { viewports: ["mobile"] },
  },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft min-h-[600px] p-4">
        <div className="mx-auto max-w-[360px]">
          <Story />
        </div>
      </div>
    ),
  ],
};
