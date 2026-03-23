/**
 * MatchResultRow Component Stories
 *
 * Dark match row with result badges (W/L/G), used by TeamSchedule.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchResultRow } from "./MatchResultRow";
import type { ScheduleMatch } from "../types";

const KCVV_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1";
const OPPONENT_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1";

const baseMatch: ScheduleMatch = {
  id: 1001,
  date: new Date("2025-11-08T14:00:00Z"),
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
  status: "scheduled",
  competition: "3de Nationale",
};

const meta = {
  title: "Features/Matches/MatchResultRow",
  component: MatchResultRow,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
    docs: {
      description: {
        component: `
Dark match row for schedule sections.

**Features:**
- W/L/G result badges with color coding
- Score in monospace white bold
- "Volgende" badge for next match
- Hover: green left border + subtle bg
- Status badges (postponed, stopped, forfeited)
- Logo placeholders for teams without logos
        `,
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-kcvv-black p-8 -m-4 max-w-4xl mx-auto">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchResultRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Upcoming match — shows vs placeholder and time
 */
export const Upcoming: Story = {
  args: {
    match: baseMatch,
    teamId: 1235,
    href: "/game/1001",
  },
};

/**
 * Win — green W badge
 */
export const Win: Story = {
  args: {
    match: {
      ...baseMatch,
      homeScore: 3,
      awayScore: 1,
      status: "finished",
    },
    teamId: 1235,
    href: "/game/1001",
  },
};

/**
 * Draw — yellow G badge
 */
export const Draw: Story = {
  args: {
    match: {
      ...baseMatch,
      homeScore: 2,
      awayScore: 2,
      status: "finished",
    },
    teamId: 1235,
    href: "/game/1001",
  },
};

/**
 * Loss — red L badge
 */
export const Loss: Story = {
  args: {
    match: {
      ...baseMatch,
      homeScore: 0,
      awayScore: 2,
      status: "finished",
    },
    teamId: 1235,
    href: "/game/1001",
  },
};

/**
 * Postponed — shows "Uitgesteld" badge
 */
export const Postponed: Story = {
  args: {
    match: {
      ...baseMatch,
      status: "postponed",
    },
    teamId: 1235,
    href: "/game/1001",
  },
};

/**
 * Next match — green left border and "Volgende" badge
 */
export const NextMatch: Story = {
  args: {
    match: baseMatch,
    teamId: 1235,
    isNext: true,
    href: "/game/1001",
  },
};

/**
 * Without logos — shows initial placeholders
 */
export const WithoutLogos: Story = {
  args: {
    match: {
      ...baseMatch,
      homeTeam: { id: 1235, name: "KCVV Elewijt" },
      awayTeam: { id: 59, name: "KFC Turnhout" },
    },
    teamId: 1235,
    href: "/game/1001",
  },
};
