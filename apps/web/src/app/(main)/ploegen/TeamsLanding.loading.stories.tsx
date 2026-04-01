import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TeamsLoading from "./loading";

const meta = {
  title: "Pages/Teams/TeamsLandingSkeleton",
  component: TeamsLoading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TeamsLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
