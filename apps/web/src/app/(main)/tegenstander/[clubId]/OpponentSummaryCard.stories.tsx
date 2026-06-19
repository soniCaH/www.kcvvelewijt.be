import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OpponentSummaryCard } from "./OpponentSummaryCard";

const meta = {
  title: "Features/Matches/OpponentSummaryCard",
  component: OpponentSummaryCard,
  parameters: { layout: "padded" },
  tags: ["vr", "autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-cream-deep mx-auto max-w-2xl p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OpponentSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** OHR Huldenberg (746) — the locked reference fixture (W3 · G2 · V1). */
export const Default: Story = {
  args: {
    summary: { wins: 3, draws: 2, losses: 1, goalsFor: 13, goalsAgainst: 7 },
  },
};

/** A goal-shy, winless history — losses in alert, zeroes still render. */
export const Winless: Story = {
  args: {
    summary: { wins: 0, draws: 1, losses: 4, goalsFor: 2, goalsAgainst: 11 },
  },
};

/** Double-digit goal columns keep the five-cell grid balanced. */
export const HighScoring: Story = {
  args: {
    summary: { wins: 12, draws: 4, losses: 3, goalsFor: 58, goalsAgainst: 29 },
  },
};
