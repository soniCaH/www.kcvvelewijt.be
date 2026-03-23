/**
 * TeamSchedule Component Stories
 *
 * Match schedule with result badges (W/L/G) and next match highlighting.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamSchedule, type ScheduleMatch } from "./TeamSchedule";

const meta = {
  title: "Features/Teams/TeamSchedule",
  component: TeamSchedule,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Team match schedule using MatchResultRow cards.

**Features:**
- W/L/G result badges with color coding
- Next match highlighting with green ring + "Volgende" badge
- Result-colored left border (green/red/yellow)
- Loading skeleton and empty states
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    matches: { control: "object", description: "Array of matches" },
    teamId: {
      control: "number",
      description: "Team ID for home/away display",
    },
    showPast: { control: "boolean", description: "Show past results" },
    highlightNext: {
      control: "boolean",
      description: "Highlight next match",
    },
    limit: {
      control: "number",
      description: "Limit number of matches shown",
    },
    isLoading: { control: "boolean", description: "Loading state" },
    className: { control: "text", description: "Additional CSS classes" },
  },
} satisfies Meta<typeof TeamSchedule>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = new Date("2025-11-01T12:00:00Z");
const pastDate = (daysAgo: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d;
};
const futureDate = (daysAhead: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  return d;
};

const KCVV_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1";
const OPPONENT_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1";

const mockMatches: ScheduleMatch[] = [
  {
    id: 1001,
    date: pastDate(21),
    time: "15:00",
    homeTeam: {
      id: 1235,
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    awayTeam: {
      id: 59,
      name: "KFC Turnhout",
      logo: OPPONENT_LOGO,
    },
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    competition: "3de Nationale",
  },
  {
    id: 1002,
    date: pastDate(14),
    time: "14:30",
    homeTeam: {
      id: 789,
      name: "SK Londerzeel",
    },
    awayTeam: {
      id: 1235,
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    homeScore: 0,
    awayScore: 2,
    status: "finished",
    competition: "3de Nationale",
  },
  {
    id: 1003,
    date: pastDate(7),
    time: "15:00",
    homeTeam: {
      id: 1235,
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    awayTeam: {
      id: 456,
      name: "FC Diest",
    },
    homeScore: 2,
    awayScore: 2,
    status: "finished",
    competition: "3de Nationale",
  },
  {
    id: 1004,
    date: futureDate(3),
    time: "15:00",
    homeTeam: {
      id: 123,
      name: "Union Mechelen",
    },
    awayTeam: {
      id: 1235,
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    status: "scheduled",
    competition: "3de Nationale",
  },
  {
    id: 1005,
    date: futureDate(10),
    time: "15:00",
    homeTeam: {
      id: 1235,
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    awayTeam: {
      id: 222,
      name: "KVK Tienen",
    },
    status: "scheduled",
    competition: "3de Nationale",
  },
  {
    id: 1006,
    date: futureDate(17),
    time: "14:00",
    homeTeam: {
      id: 333,
      name: "VK Linden",
    },
    awayTeam: {
      id: 1235,
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
    },
    status: "scheduled",
    competition: "Beker van Brabant",
  },
];

/**
 * Default - Full schedule with past and future matches
 */
export const Default: Story = {
  args: {
    matches: mockMatches,
    teamId: 1235,
    showPast: true,
    highlightNext: true,
  },
};

/**
 * Upcoming only - Only future matches
 */
export const UpcomingOnly: Story = {
  args: {
    matches: mockMatches.filter((m) => m.status === "scheduled"),
    teamId: 1235,
    showPast: false,
    highlightNext: true,
  },
};

/**
 * Results only - Only past matches with scores
 */
export const ResultsOnly: Story = {
  args: {
    matches: mockMatches.filter((m) => m.status === "finished"),
    teamId: 1235,
    showPast: true,
    highlightNext: false,
  },
};

/**
 * Compact view - Limited matches
 */
export const Compact: Story = {
  args: {
    matches: mockMatches,
    teamId: 1235,
    showPast: true,
    highlightNext: true,
    limit: 3,
  },
};

/**
 * With postponed match
 */
export const WithPostponed: Story = {
  args: {
    matches: [
      ...mockMatches.slice(0, 3),
      {
        id: 1007,
        date: futureDate(5),
        time: "15:00",
        homeTeam: {
          id: 1235,
          name: "KCVV Elewijt",
          logo: KCVV_LOGO,
        },
        awayTeam: {
          id: 444,
          name: "SC Grimbergen",
        },
        status: "postponed",
        competition: "3de Nationale",
      },
      ...mockMatches.slice(3),
    ],
    teamId: 1235,
    showPast: true,
    highlightNext: true,
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  args: {
    matches: [],
    teamId: 1235,
    isLoading: true,
  },
};

/**
 * Empty state - No scheduled matches
 */
export const Empty: Story = {
  args: {
    matches: [],
    teamId: 1235,
  },
};

/**
 * Without team logos
 */
export const WithoutLogos: Story = {
  args: {
    matches: mockMatches.map((m) => ({
      ...m,
      homeTeam: { ...m.homeTeam, logo: undefined },
      awayTeam: { ...m.awayTeam, logo: undefined },
    })),
    teamId: 1235,
    showPast: true,
    highlightNext: true,
  },
};
