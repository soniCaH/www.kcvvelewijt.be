import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GoalKcvvTemplate } from "./GoalKcvvTemplate";

const meta = {
  title: "Features/Share/GoalKcvvTemplate",
  component: GoalKcvvTemplate,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof GoalKcvvTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    playerName: "Mertens",
    shirtNumber: 9,
    score: "1 - 0",
    matchName: "KCVV Elewijt — Eppegem",
    minute: "67",
    imageUrl: "/images/ultras.jpg",
  },
};

export const FilledNoImage: Story = {
  args: {
    playerName: "Janssen",
    shirtNumber: 14,
    score: "2 - 0",
    matchName: "KCVV Elewijt — Eppegem",
    minute: "73",
    // Placeholder opponent crest for Storybook (real value: away_team.logo).
    awayLogo: "/images/logo-flat.png",
  },
};

export const LateGoal: Story = {
  args: {
    playerName: "Jan Peeters",
    shirtNumber: 9,
    score: "3 - 2",
    matchName: "KCVV Elewijt — Sporting Hasselt",
    minute: "90+3",
  },
};
