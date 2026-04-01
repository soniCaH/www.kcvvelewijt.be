/**
 * SearchFilters Storybook Stories
 * Demonstrates filter states with Lucide icons
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchFilters } from "./SearchFilters";

const meta = {
  title: "Features/Search/SearchFilters",
  component: SearchFilters,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onFilterChange: () => {},
  },
} satisfies Meta<typeof SearchFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default filters with "all" active
 */
export const AllActive: Story = {
  args: {
    activeType: "all",
    resultCounts: {
      all: 42,
      article: 25,
      player: 12,
      staff: 0,
      team: 5,
    },
  },
};

/**
 * Article filter active
 */
export const ArticleActive: Story = {
  args: {
    activeType: "article",
    resultCounts: {
      all: 42,
      article: 25,
      player: 12,
      staff: 0,
      team: 5,
    },
  },
};

/**
 * Player filter active
 */
export const PlayerActive: Story = {
  args: {
    activeType: "player",
    resultCounts: {
      all: 42,
      article: 25,
      player: 12,
      staff: 0,
      team: 5,
    },
  },
};

/**
 * Team filter active
 */
export const TeamActive: Story = {
  args: {
    activeType: "team",
    resultCounts: {
      all: 42,
      article: 25,
      player: 12,
      staff: 0,
      team: 5,
    },
  },
};

/**
 * No results
 */
export const NoResults: Story = {
  args: {
    activeType: "all",
    resultCounts: {
      all: 0,
      article: 0,
      player: 0,
      staff: 0,
      team: 0,
    },
  },
};
