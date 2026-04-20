import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchesSliderEmptyState } from "./MatchesSliderEmptyState";

const meta = {
  title: "Features/Home/MatchesSliderEmptyState",
  component: MatchesSliderEmptyState,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <section className="bg-kcvv-black py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Story />
        </div>
      </section>
    ),
  ],
} satisfies Meta<typeof MatchesSliderEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SplitBaseline: Story = {
  args: {
    layout: "split",
  },
};

export const CenteredBaseline: Story = {
  args: {
    layout: "centered",
  },
};
