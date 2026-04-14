import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WebshopSection } from "./WebshopSection";

const meta = {
  title: "Features/Homepage/WebshopSection",
  component: WebshopSection,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WebshopSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
