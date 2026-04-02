/**
 * PlayerStats Component Stories
 *
 * Statistics display table/grid for player performance data.
 * Data sourced from PSD API via BFF.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerStats } from "./PlayerStats";

const meta = {
  title: "Features/Players/PlayerStats",
  component: PlayerStats,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Statistics display component for player performance data.

Features:
- Season statistics table
- Position-specific stats (outfield vs goalkeeper)
- Multi-season historical view
- Loading and empty states

**Note:** Data comes from the PSD API via BFF (external).
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: ["outfield", "goalkeeper"],
      description: "Player position type for stat display",
    },
    isLoading: {
      control: "boolean",
      description: "Loading state",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerStats>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default stats display for outfield player
 */
export const Default: Story = {
  args: {
    position: "outfield",
    stats: [
      {
        season: "2024-2025",
        matches: 18,
        goals: 5,
        assists: 8,
        yellowCards: 2,
        redCards: 0,
        minutesPlayed: 1520,
      },
    ],
  },
};

/**
 * Striker with high goal tally
 */
export const WithGoals: Story = {
  args: {
    position: "outfield",
    stats: [
      {
        season: "2024-2025",
        matches: 20,
        goals: 15,
        assists: 4,
        yellowCards: 3,
        redCards: 0,
        minutesPlayed: 1680,
      },
    ],
  },
};

/**
 * Goalkeeper-specific statistics
 */
export const Goalkeeper: Story = {
  args: {
    position: "goalkeeper",
    stats: [
      {
        season: "2024-2025",
        matches: 22,
        cleanSheets: 8,
        goalsConceded: 18,
        saves: 72,
        yellowCards: 1,
        redCards: 0,
        minutesPlayed: 1980,
      },
    ],
  },
};

/**
 * Multiple seasons of historical data
 */
export const MultiSeason: Story = {
  args: {
    position: "outfield",
    stats: [
      {
        season: "2024-2025",
        matches: 18,
        goals: 5,
        assists: 8,
        yellowCards: 2,
        redCards: 0,
        minutesPlayed: 1520,
      },
      {
        season: "2023-2024",
        matches: 28,
        goals: 12,
        assists: 10,
        yellowCards: 4,
        redCards: 1,
        minutesPlayed: 2340,
      },
      {
        season: "2022-2023",
        matches: 25,
        goals: 8,
        assists: 7,
        yellowCards: 3,
        redCards: 0,
        minutesPlayed: 2100,
      },
    ],
  },
};

/**
 * Empty state when no statistics available
 */
export const Empty: Story = {
  args: {
    position: "outfield",
    stats: [],
  },
};

/**
 * Loading state with skeleton placeholders
 */
export const Loading: Story = {
  args: {
    position: "outfield",
    stats: [],
    isLoading: true,
  },
};
