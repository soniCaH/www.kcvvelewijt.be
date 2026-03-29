import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GoalOpponentTemplate } from "./GoalOpponentTemplate";

const meta = {
  title: "Features/Share/GoalOpponentTemplate",
  component: GoalOpponentTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GoalOpponentTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    score: "0 - 1",
    matchName: "KCVV Elewijt - FC Opponent",
    minute: "33",
  },
};

export const TwoGoalsDown: Story = {
  args: {
    score: "1 - 3",
    matchName: "KCVV Elewijt - Sporting Hasselt",
    minute: "67",
  },
};
