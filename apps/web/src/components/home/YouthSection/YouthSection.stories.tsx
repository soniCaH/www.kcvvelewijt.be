import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YouthSection } from "./YouthSection";

const meta = {
  title: "Features/Homepage/YouthSection",
  component: YouthSection,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof YouthSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
