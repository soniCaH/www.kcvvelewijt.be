/**
 * MatchResultRow Component Stories
 *
 * Match row card with result badges (W/L/G), used by TeamSchedule.
 * Supports light and dark themes.
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
  isHome: true,
};

const meta = {
  title: "Features/Matches/MatchResultRow",
  component: MatchResultRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Match row card for schedule sections. Supports light and dark themes.

**Features:**
- W/L/G result badges with color coding
- "Volgende" badge for next match
- Status badges (postponed, stopped, forfeited)
- Logo placeholders for teams without logos
- Light theme: white card with colored left border for results
- Dark theme: dark bg with hover effects
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MatchResultRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Upcoming match — shows VS placeholder and time
 */
export const Upcoming: Story = {
  args: {
    match: baseMatch,
    href: "/wedstrijd/1001",
  },
};

/**
 * Win — green W badge with green left border
 */
export const Win: Story = {
  args: {
    match: {
      ...baseMatch,
      homeScore: 3,
      awayScore: 1,
      status: "finished",
    },
    href: "/wedstrijd/1001",
  },
};

/**
 * Draw — yellow G badge with yellow left border
 */
export const Draw: Story = {
  args: {
    match: {
      ...baseMatch,
      homeScore: 2,
      awayScore: 2,
      status: "finished",
    },
    href: "/wedstrijd/1001",
  },
};

/**
 * Loss — red L badge with red left border
 */
export const Loss: Story = {
  args: {
    match: {
      ...baseMatch,
      homeScore: 0,
      awayScore: 2,
      status: "finished",
    },
    href: "/wedstrijd/1001",
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
    href: "/wedstrijd/1001",
  },
};

/**
 * Next match — green ring and "Volgende" badge
 */
export const NextMatch: Story = {
  args: {
    match: baseMatch,
    isNext: true,
    href: "/wedstrijd/1001",
  },
};

/**
 * Away match — shows "Uit · Competitie" label below the match row
 */
export const AwayMatch: Story = {
  args: {
    match: {
      ...baseMatch,
      isHome: false,
      homeTeam: { id: 59, name: "KFC Turnhout", logo: OPPONENT_LOGO },
      awayTeam: { id: 1235, name: "KCVV Elewijt", logo: KCVV_LOGO },
    },
    href: "/wedstrijd/1001",
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
    href: "/wedstrijd/1001",
  },
};

const darkBgDecorator = (Story: () => React.ReactNode) => (
  <div className="bg-kcvv-black p-8 -m-4">
    <Story />
  </div>
);

/**
 * Dark theme — for use in dark background sections
 */
export const DarkTheme: Story = {
  args: {
    match: baseMatch,
    theme: "dark",
    href: "/wedstrijd/1001",
  },
  decorators: [darkBgDecorator],
};

/**
 * Dark theme with score — W badge on dark background
 */
export const DarkThemeWin: Story = {
  args: {
    match: {
      ...baseMatch,
      homeScore: 3,
      awayScore: 1,
      status: "finished",
    },
    theme: "dark",
    href: "/wedstrijd/1001",
  },
  decorators: [darkBgDecorator],
};

/**
 * Dark theme next match
 */
export const DarkThemeNextMatch: Story = {
  args: {
    match: baseMatch,
    theme: "dark",
    isNext: true,
    href: "/wedstrijd/1001",
  },
  decorators: [darkBgDecorator],
};
