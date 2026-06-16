import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YellowCardKcvvTemplate } from "./YellowCardKcvvTemplate";

const meta = {
  title: "Features/Share/YellowCardKcvvTemplate",
  component: YellowCardKcvvTemplate,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof YellowCardKcvvTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerName: "De Smet",
    shirtNumber: 4,
    matchName: "KCVV Elewijt — Eppegem",
    minute: "54",
  },
};

export const EarlyCard: Story = {
  args: {
    playerName: "Jan Peeters",
    shirtNumber: 3,
    matchName: "KCVV Elewijt — Sporting Hasselt",
    minute: "12",
  },
};
