import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchesSliderSection } from "./MatchesSliderSection";
import { mockMatches } from "@/components/match/match.mocks";

const meta = {
  title: "Features/Homepage/MatchesSliderSection",
  component: MatchesSliderSection,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <section className="bg-kcvv-black py-16">
        <Story />
      </section>
    ),
  ],
} satisfies Meta<typeof MatchesSliderSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const inDays = (n: number) =>
  new Date(new Date().setUTCHours(0, 0, 0, 0) + n * MS_PER_DAY);

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

export const EmptyWithoutPlaceholder: Story = {
  args: {
    matches: [],
    highlightTeamId: 1235,
  },
  parameters: { backgrounds: { default: "dark" } },
};

export const EmptyWithCountdown: Story = {
  args: {
    matches: [],
    highlightTeamId: 1235,
    placeholder: {
      nextSeasonKickoff: inDays(70),
    },
  },
  parameters: { backgrounds: { default: "dark" } },
};
