import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchWidget } from "./MatchWidget";
import {
  mockUpcomingMatch,
  mockFinishedMatchWin,
  mockFinishedMatchDraw,
  mockPostponedMatch,
  mockForfeitedMatch,
  mockLongTeamNames,
} from "./MatchWidget.mocks";

const meta = {
  title: "Features/Home/MatchWidget",
  component: MatchWidget,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Homepage match widget — dark-green full-width section showing the next or most recent A-team match. Diagonal cuts at top (kcvv-black) and bottom (gray-100) connect to adjacent sections. Replaces `UpcomingMatches` on the homepage.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    match: mockUpcomingMatch,
    teamLabel: "A-Ploeg",
  },
} satisfies Meta<typeof MatchWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {
  args: { match: mockUpcomingMatch, teamLabel: "A-Ploeg" },
};

export const Finished: Story = {
  args: { match: mockFinishedMatchWin, teamLabel: "A-Ploeg" },
  parameters: {
    docs: { description: { story: "Finished match with final score (win)." } },
  },
};

export const Draw: Story = {
  args: { match: mockFinishedMatchDraw, teamLabel: "A-Ploeg" },
  parameters: {
    docs: { description: { story: "Finished match with draw score." } },
  },
};

export const Postponed: Story = {
  args: { match: mockPostponedMatch, teamLabel: "A-Ploeg" },
  parameters: {
    docs: {
      description: {
        story: "Postponed match — shows UITGESTELD badge in centre column.",
      },
    },
  },
};

export const Forfeited: Story = {
  args: { match: mockForfeitedMatch, teamLabel: "A-Ploeg" },
  parameters: {
    docs: { description: { story: "Forfeited match — shows FF badge." } },
  },
};

export const LongTeamNames: Story = {
  args: { match: mockLongTeamNames, teamLabel: "A-Ploeg" },
  parameters: {
    docs: {
      description: {
        story:
          "Stress test: away team name is 30+ characters. Verifies line-clamp truncation.",
      },
    },
  },
};

export const CustomTeamLabel: Story = {
  args: { match: mockUpcomingMatch, teamLabel: "B-Ploeg" },
};
