import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GoalOpponentTemplate } from "./GoalOpponentTemplate";

const meta = {
  title: "Features/Share/GoalOpponentTemplate",
  component: GoalOpponentTemplate,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GoalOpponentTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

// Placeholder opponent crest for Storybook (real value: away_team.logo).
const OPPONENT_CREST = "/images/logo-flat.png";

export const Default: Story = {
  args: {
    score: "2 - 1",
    matchName: "KCVV Elewijt — Eppegem",
    minute: "78",
    competition: "2e Provinciale",
    awayLogo: OPPONENT_CREST,
  },
};

export const EarlyGoal: Story = {
  args: {
    score: "0 - 1",
    matchName: "KCVV Elewijt — Sporting Hasselt",
    minute: "12",
    competition: "2e Provinciale",
    awayLogo: OPPONENT_CREST,
  },
};
