import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HalftimeTemplate } from "./HalftimeTemplate";

const meta = {
  title: "Features/Share/HalftimeTemplate",
  component: HalftimeTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HalftimeTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Leading: Story = {
  args: {
    matchName: "KCVV Elewijt - FC Opponent",
    score: "1 - 0",
  },
};

export const Trailing: Story = {
  args: {
    matchName: "KCVV Elewijt - FC Opponent",
    score: "0 - 1",
  },
};

export const Level: Story = {
  args: {
    matchName: "KCVV Elewijt - Sporting Hasselt",
    score: "1 - 1",
  },
};
