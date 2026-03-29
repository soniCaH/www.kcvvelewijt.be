import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RedCardOpponentTemplate } from "./RedCardOpponentTemplate";

const meta = {
  title: "Features/Share/RedCardOpponentTemplate",
  component: RedCardOpponentTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RedCardOpponentTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    matchName: "KCVV Elewijt - FC Opponent",
    minute: "82",
  },
};

export const EarlyExpulsion: Story = {
  args: {
    matchName: "KCVV Elewijt - Sporting Hasselt",
    minute: "34",
  },
};
