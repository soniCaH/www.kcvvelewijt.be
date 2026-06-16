import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RedCardOpponentTemplate } from "./RedCardOpponentTemplate";

const meta = {
  title: "Features/Share/RedCardOpponentTemplate",
  component: RedCardOpponentTemplate,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RedCardOpponentTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    matchName: "KCVV Elewijt — Eppegem",
    minute: "81",
  },
};

export const EarlyExpulsion: Story = {
  args: {
    matchName: "Sporting Hasselt — KCVV Elewijt",
    minute: "34",
  },
};
