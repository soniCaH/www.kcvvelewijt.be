import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RedCardKcvvTemplate } from "./RedCardKcvvTemplate";

const meta = {
  title: "Features/Share/RedCardKcvvTemplate",
  component: RedCardKcvvTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RedCardKcvvTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerName: "Kevin Van Ransbeeck",
    shirtNumber: 10,
    matchName: "KCVV Elewijt — FC Opponent",
    minute: "67",
  },
};

export const LateGame: Story = {
  args: {
    playerName: "Jan Peeters",
    shirtNumber: 5,
    matchName: "KCVV Elewijt — Sporting Hasselt",
    minute: "88",
  },
};
