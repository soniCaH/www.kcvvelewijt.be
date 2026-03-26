import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeedbackWidget } from "./FeedbackWidget";

const meta = {
  title: "Features/Responsibility/FeedbackWidget",
  component: FeedbackWidget,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    pathSlug: "inschrijving-nieuw-lid",
    pathTitle: "Inschrijving nieuw lid",
  },
} satisfies Meta<typeof FeedbackWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DifferentPath: Story = {
  args: {
    pathSlug: "ongeval-speler-training",
    pathTitle: "Ik heb een ongeval op training/wedstrijd",
  },
};
