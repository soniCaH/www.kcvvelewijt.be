import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GoalKcvvTemplate } from "./GoalKcvvTemplate";

const meta = {
  title: "Features/Share/GoalKcvvTemplate",
  component: GoalKcvvTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GoalKcvvTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCelebrationImage: Story = {
  args: {
    playerName: "Kevin Van Ransbeeck",
    shirtNumber: 10,
    score: "1 - 0",
    matchName: "KCVV Elewijt - FC Opponent",
    minute: "45",
    celebrationImageUrl:
      "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
  },
};

export const WithoutCelebrationImage: Story = {
  args: {
    playerName: "Kevin Van Ransbeeck",
    shirtNumber: 10,
    score: "2 - 1",
    matchName: "KCVV Elewijt - FC Opponent",
    minute: "78",
  },
};

export const LateGoal: Story = {
  args: {
    playerName: "Jan Peeters",
    shirtNumber: 9,
    score: "3 - 2",
    matchName: "KCVV Elewijt - Sporting Hasselt",
    minute: "90+3",
  },
};
