/**
 * MatchesSlider Component Stories
 * Horizontally scrollable row of compact match teasers
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchesSlider } from "./MatchesSlider";
import {
  mockScheduledMatches,
  mockScheduledMatchWithScores,
  mockFinishedMatch,
  mockMatches,
} from "@/components/home/UpcomingMatches/UpcomingMatches.mocks";

const KCVV_ID = 1235;

const meta = {
  title: "Features/Matches/MatchesSlider",
  component: MatchesSlider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Horizontally scrollable strip of compact match teasers. Useful on the homepage or in sidebar widgets to preview the schedule at a glance.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MatchesSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three upcoming matches with section heading. */
export const Default: Story = {
  args: {
    matches: mockScheduledMatches,
    title: "Aankomende wedstrijden",
    highlightTeamId: KCVV_ID,
  },
};

/** Seven matches — scroll is necessary. */
export const Many: Story = {
  args: {
    matches: mockMatches.mixed,
    title: "Alle wedstrijden",
    highlightTeamId: KCVV_ID,
  },
};

/** Single match. */
export const Single: Story = {
  args: {
    matches: [mockScheduledMatchWithScores],
    highlightTeamId: KCVV_ID,
  },
};

/** Mixed statuses without a heading. */
export const Mixed: Story = {
  args: {
    matches: [
      mockScheduledMatchWithScores,
      mockScheduledMatches[0],
      mockFinishedMatch,
    ],
    highlightTeamId: KCVV_ID,
  },
};

/** Empty matches array — component renders nothing (null). */
export const Empty: Story = {
  args: {
    matches: [],
    highlightTeamId: KCVV_ID,
  },
};

/** Mobile viewport — horizontal scroll is most obvious here. */
export const MobileView: Story = {
  args: {
    matches: mockMatches.mixed,
    title: "Aankomende wedstrijden",
    highlightTeamId: KCVV_ID,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};
