/**
 * MatchList Component Stories
 * Vertical stacked list of match teasers
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchList } from "./MatchList";
import {
  mockScheduledMatches,
  mockForfeitedMatch,
  mockFinishedMatch,
  mockPostponedMatch,
  mockMatches,
} from "@/components/home/UpcomingMatches/UpcomingMatches.mocks";

const KCVV_ID = 1235;

const meta = {
  title: "Features/Matches/MatchList",
  component: MatchList,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Vertical stacked list of matches using MatchTeaser. Handles status normalisation from `scheduled` to `upcoming` internally.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three upcoming matches. */
export const Upcoming: Story = {
  args: {
    matches: mockScheduledMatches,
  },
};

/** Mixed statuses — scheduled, finished, postponed, stopped, and forfeited. */
export const Mixed: Story = {
  args: {
    matches: mockMatches.mixed,
  },
};

/** KCVV highlighted in each row. */
export const WithHighlight: Story = {
  args: {
    matches: mockMatches.mixed,
    highlightTeamId: KCVV_ID,
  },
};

/** No matches available. */
export const Empty: Story = {
  args: {
    matches: [],
  },
};

/** Custom empty message. */
export const EmptyCustomMessage: Story = {
  args: {
    matches: [],
    emptyMessage: "Er zijn momenteel geen wedstrijden gepland.",
  },
};

/** Loading skeleton state. */
export const Loading: Story = {
  args: {
    matches: [],
    isLoading: true,
    loadingCount: 3,
  },
};

/** Single finished match. */
export const Finished: Story = {
  args: {
    matches: [mockFinishedMatch],
    highlightTeamId: KCVV_ID,
  },
};

/** Single forfeited match. */
export const Forfeited: Story = {
  args: {
    matches: [mockForfeitedMatch],
    highlightTeamId: KCVV_ID,
  },
};

/** Postponed and forfeited matches. */
export const Disrupted: Story = {
  args: {
    matches: [mockPostponedMatch, mockForfeitedMatch],
  },
};
