import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FullTimeTemplate } from "./FullTimeTemplate";

const meta = {
  title: "Features/Share/FullTimeTemplate",
  component: FullTimeTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FullTimeTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Win: Story = {
  args: {
    matchName: "KCVV Elewijt - FC Opponent",
    score: "3 - 1",
    mood: "win",
  },
};

export const Draw: Story = {
  args: {
    matchName: "KCVV Elewijt - Sporting Hasselt",
    score: "2 - 2",
    mood: "draw",
  },
};

export const Loss: Story = {
  args: {
    matchName: "FC Opponent - KCVV Elewijt",
    score: "4 - 1",
    mood: "loss",
  },
};
