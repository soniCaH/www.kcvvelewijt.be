import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KickoffTemplate } from "./KickoffTemplate";

const meta = {
  title: "Features/Share/KickoffTemplate",
  component: KickoffTemplate,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof KickoffTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    matchName: "KCVV Elewijt — FC Opponent",
  },
};

export const HomeMatch: Story = {
  args: {
    matchName: "KCVV Elewijt — Sporting Hasselt",
  },
};

export const AwayMatch: Story = {
  args: {
    matchName: "FC Luik — KCVV Elewijt",
  },
};
