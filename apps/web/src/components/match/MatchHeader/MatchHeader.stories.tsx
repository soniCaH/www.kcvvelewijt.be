/**
 * MatchHeader Component Stories
 *
 * Hero section for match detail pages.
 * Displays teams, score, date/time, and competition info.
 *
 * Stories created BEFORE implementation (Storybook-first workflow).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchHeader } from "./MatchHeader";

const KCVV_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/1235.png?v=1";
const OPPONENT_LOGO =
  "https://dfaozfi7c7f3s.cloudfront.net/logos/extra_groot/59.png?v=1";

const meta = {
  title: "Features/Matches/MatchHeader",
  component: MatchHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
Hero section for match detail pages.

**Features:**
- Team logos and names
- Score display (for finished/live matches)
- Date and time
- Competition badge
- Status indicators (Live, Postponed, Cancelled)

**Usage:**
Used at the top of match detail pages (/game/[matchId]).
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
    isLoading: { control: "boolean", description: "Loading state" },
  },
} satisfies Meta<typeof MatchHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default - Finished match with score
 */
export const Default: Story = {
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
  },
};

/**
 * Scheduled match - no score yet
 */
export const Scheduled: Story = {
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
  },
};

/**
 * Forfeited match (FF result)
 */
export const Forfeited: Story = {
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
  },
};

/**
 * Postponed match
 */
export const Postponed: Story = {
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
  },
};

/**
 * Stopped match (ended prematurely)
 */
export const Stopped: Story = {
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
  },
};

/**
 * High-scoring match
 */
export const HighScore: Story = {
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
      score: 7,
    },
    awayTeam: {
      name: "Opponent FC",
      logo: OPPONENT_LOGO,
      score: 2,
    },
    date: new Date("2025-11-30T15:00:00Z"),
    time: "15:00",
    status: "finished",
    competition: "Beker van Brabant",
  },
};

/**
 * Draw result
 */
export const Draw: Story = {
  args: {
    homeTeam: {
      name: "Away Team FC",
      logo: OPPONENT_LOGO,
      score: 2,
    },
    awayTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
      score: 2,
    },
    date: new Date("2025-11-23T14:30:00Z"),
    time: "14:30",
    status: "finished",
    competition: "3de Nationale",
  },
};

/**
 * Without team logos
 */
export const WithoutLogos: Story = {
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
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  args: {
    homeTeam: { name: "" },
    awayTeam: { name: "" },
    date: new Date("2025-01-15T15:30:00Z"),
    status: "scheduled",
    isLoading: true,
  },
};

/**
 * Mobile viewport
 */
export const MobileView: Story = {
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
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Friendly match (different competition badge style)
 */
export const FriendlyMatch: Story = {
  args: {
    homeTeam: {
      name: "KCVV Elewijt",
      logo: KCVV_LOGO,
      score: 5,
    },
    awayTeam: {
      name: "Local FC",
      logo: OPPONENT_LOGO,
      score: 1,
    },
    date: new Date("2025-07-15T19:00:00Z"),
    time: "19:00",
    status: "finished",
    competition: "Vriendschappelijk",
  },
};
