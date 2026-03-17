import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchesSliderSection } from "./MatchesSliderSection";
import { mockMatches } from "@/components/home/UpcomingMatches/UpcomingMatches.mocks";

const meta = {
  title: "Features/Homepage/MatchesSliderSection",
  component: MatchesSliderSection,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MatchesSliderSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    matches: mockMatches.mixed.map((m, i) => ({
      ...m,
      teamLabel: i < 3 ? "A-Ploeg" : "U17",
    })),
    highlightTeamId: 1235,
  },
  parameters: { backgrounds: { default: "dark" } },
};
