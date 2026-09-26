import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import OpponentLoading from "./loading";

const meta = {
  title: "Pages/Opponent/OpponentSkeleton",
  component: OpponentLoading,
  tags: ["autodocs", "pages-a11y"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OpponentLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
