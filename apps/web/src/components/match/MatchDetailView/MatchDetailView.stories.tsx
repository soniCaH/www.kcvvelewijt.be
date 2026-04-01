/**
 * MatchDetailView Component Stories
 *
 * Composite component for match detail pages.
 * Combines MatchHeader with lineup sections.
 *
 * Stories created BEFORE implementation (Storybook-first workflow).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchDetailView } from "./MatchDetailView";
import type { LineupPlayer } from "../MatchLineup";
import type { MatchEvent } from "../MatchEvents/MatchEvents";
import MatchDetailLoading from "@/app/(main)/wedstrijd/[matchId]/loading";

const KCVV_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1";
const OPPONENT_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1";

const mockHomeLineup: LineupPlayer[] = [
  {
    id: 1,
    name: "Van Hoof Jannes",
    number: 99,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 2,
    name: "Merckaert Wout",
    number: 3,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 3,
    name: "Bouakhounov Amirgan",
    number: 5,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 4,
    name: "Breugelmans Maxim",
    number: 10,
    isCaptain: true,
    status: "starter",
  },
  {
    id: 5,
    name: "Mertens Alec",
    number: 17,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 6,
    name: "El Attabi Adil",
    number: 20,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 7,
    name: "Bell Alexander",
    number: 21,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 8,
    name: "Barbieux Milan",
    number: 15,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 9,
    name: "Vantomme Marnicqo",
    number: 8,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 10,
    name: "Fozin Tembou James",
    number: 9,
    minutesPlayed: 75,
    isCaptain: false,
    status: "substituted",
  },
  {
    id: 11,
    name: "Beersaerts Yanis",
    number: 25,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 12,
    name: "Honshoven Lucas",
    number: 12,
    isCaptain: false,
    status: "substitute",
  },
];

const mockAwayLineup: LineupPlayer[] = [
  {
    id: 101,
    name: "Janssen Pieter",
    number: 1,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 102,
    name: "De Vries Tom",
    number: 4,
    isCaptain: true,
    status: "starter",
  },
  {
    id: 103,
    name: "Hermans Kevin",
    number: 5,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 104,
    name: "Peeters Jef",
    number: 7,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 105,
    name: "Maes Wim",
    number: 9,
    minutesPlayed: 65,
    isCaptain: false,
    status: "substituted",
  },
  {
    id: 106,
    name: "Van Damme Kris",
    number: 10,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 107,
    name: "Claes Bart",
    number: 11,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 108,
    name: "Wouters Steven",
    number: 14,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 109,
    name: "Jacobs Raf",
    number: 18,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 110,
    name: "Lenaerts Sven",
    number: 22,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 111,
    name: "Michiels Dirk",
    number: 33,
    isCaptain: false,
    status: "starter",
  },
  {
    id: 112,
    name: "Verhoeven Nick",
    number: 16,
    isCaptain: false,
    status: "substitute",
  },
];

const meta = {
  title: "Features/Matches/MatchDetailView",
  component: MatchDetailView,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
Composite component for match detail pages.

**Features:**
- Match header with teams, score, and status
- Lineup section for both teams
- Loading state support
- Responsive layout

**Usage:**
Used as the main view component on match detail pages (/wedstrijd/[matchId]).
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    homeTeam: { control: "object", description: "Home team info" },
    awayTeam: { control: "object", description: "Away team info" },
    date: { control: "date", description: "Match date" },
    time: { control: "text", description: "Match time (HH:MM)" },
    status: {
      control: "select",
      options: ["scheduled", "finished", "forfeited", "postponed", "stopped"],
      description: "Match status",
    },
    competition: { control: "text", description: "Competition name" },
    homeLineup: { control: "object", description: "Home team lineup" },
    awayLineup: { control: "object", description: "Away team lineup" },
    isLoading: { control: "boolean", description: "Loading state" },
  },
} satisfies Meta<typeof MatchDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Render wrapper to normalize date from Storybook controls
 * Storybook date control emits numeric timestamp, but component expects Date
 */
const render: Story["render"] = (args) => {
  const normalizedDate =
    typeof args.date === "number" ? new Date(args.date) : args.date;
  return <MatchDetailView {...args} date={normalizedDate} />;
};

/**
 * Default - Finished match with full lineups
 */
export const Default: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
      score: 3,
    },
    awayTeam: {
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
      score: 1,
    },
    date: new Date("2025-12-07T15:00:00Z"),
    time: "15:00",
    status: "finished",
    competition: "3de Nationale",
    homeLineup: mockHomeLineup,
    awayLineup: mockAwayLineup,
    hasReport: true,
  },
};

/**
 * Scheduled match - no score or lineup yet
 */
export const Scheduled: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    awayTeam: {
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
    },
    date: new Date("2025-12-14T15:00:00Z"),
    time: "15:00",
    status: "scheduled",
    competition: "3de Nationale",
    homeLineup: [],
    awayLineup: [],
  },
};

/**
 * Forfeited match (FF result) with lineups
 */
export const Forfeited: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
      score: 3,
    },
    awayTeam: {
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
      score: 0,
    },
    date: new Date("2025-01-15T15:30:00Z"),
    time: "15:30",
    status: "forfeited",
    competition: "3de Nationale",
    homeLineup: mockHomeLineup.filter((p) => p.status === "starter"),
    awayLineup: mockAwayLineup.filter((p) => p.status === "starter"),
  },
};

/**
 * Postponed match
 */
export const Postponed: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    awayTeam: {
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
    },
    date: new Date("2025-12-07T15:00:00Z"),
    time: "15:00",
    status: "postponed",
    competition: "3de Nationale",
    homeLineup: [],
    awayLineup: [],
  },
};

/**
 * Stopped match (ended prematurely)
 */
export const Stopped: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    awayTeam: {
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
    },
    date: new Date("2025-12-07T15:00:00Z"),
    time: "15:00",
    status: "stopped",
    competition: "3de Nationale",
    homeLineup: [],
    awayLineup: [],
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  render,
  args: {
    homeTeam: { name: "" },
    awayTeam: { name: "" },
    date: new Date("2025-01-15T15:30:00Z"),
    status: "scheduled",
    homeLineup: [],
    awayLineup: [],
    isLoading: true,
  },
};

/**
 * Without logos
 */
export const WithoutLogos: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      score: 4,
    },
    awayTeam: {
      name: "Unknown FC",
      score: 0,
    },
    date: new Date("2025-12-07T15:00:00Z"),
    time: "15:00",
    status: "finished",
    competition: "Vriendschappelijk",
    homeLineup: mockHomeLineup,
    awayLineup: [],
    hasReport: true,
  },
};

const mockEvents: MatchEvent[] = [
  {
    id: 1,
    type: "goal",
    minute: 23,
    team: "home",
    player: "Breugelmans Maxim",
  },
  {
    id: 2,
    type: "yellow_card",
    minute: 34,
    team: "away",
    player: "De Vries Tom",
  },
  {
    id: 3,
    type: "goal",
    minute: 56,
    team: "home",
    player: "Fozin Tembou James",
    isPenalty: true,
  },
  {
    id: 4,
    type: "substitution",
    minute: 65,
    team: "away",
    playerIn: "Verhoeven Nick",
    playerOut: "Maes Wim",
  },
  {
    id: 5,
    type: "goal",
    minute: 78,
    team: "away",
    player: "Van Damme Kris",
  },
  {
    id: 6,
    type: "red_card",
    minute: 88,
    team: "away",
    player: "Claes Bart",
  },
  {
    id: 7,
    type: "goal",
    minute: 90,
    additionalTime: 3,
    team: "home",
    player: "El Attabi Adil",
  },
];

/**
 * Finished match with full events timeline
 */
export const WithEvents: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
      score: 3,
    },
    awayTeam: {
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
      score: 1,
    },
    date: new Date("2025-12-07T15:00:00Z"),
    time: "15:00",
    status: "finished",
    competition: "3de Nationale",
    homeLineup: mockHomeLineup,
    awayLineup: mockAwayLineup,
    hasReport: true,
    events: mockEvents,
  },
};

/**
 * Finished match with empty events (no data available)
 */
export const WithEmptyEvents: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
      score: 2,
    },
    awayTeam: {
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
      score: 0,
    },
    date: new Date("2025-12-07T15:00:00Z"),
    time: "15:00",
    status: "finished",
    competition: "3de Nationale",
    homeLineup: mockHomeLineup,
    awayLineup: mockAwayLineup,
    events: [],
  },
};

/**
 * Mobile viewport
 */
export const MobileView: Story = {
  render,
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
      score: 3,
    },
    awayTeam: {
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
      score: 1,
    },
    date: new Date("2025-12-07T15:00:00Z"),
    time: "15:00",
    status: "finished",
    competition: "3de Nationale",
    homeLineup: mockHomeLineup,
    awayLineup: mockAwayLineup,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const RouteSkeleton: StoryObj = {
  render: () => <MatchDetailLoading />,
  parameters: { layout: "fullscreen" },
};
