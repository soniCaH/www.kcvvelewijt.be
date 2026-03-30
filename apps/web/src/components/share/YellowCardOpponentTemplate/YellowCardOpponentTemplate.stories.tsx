import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YellowCardOpponentTemplate } from "./YellowCardOpponentTemplate";

const meta = {
  title: "Features/Share/YellowCardOpponentTemplate",
  component: YellowCardOpponentTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof YellowCardOpponentTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    matchName: "KCVV Elewijt — FC Opponent",
    minute: "38",
  },
};

export const LateCard: Story = {
  args: {
    matchName: "FC Opponent — KCVV Elewijt",
    minute: "85",
  },
};
