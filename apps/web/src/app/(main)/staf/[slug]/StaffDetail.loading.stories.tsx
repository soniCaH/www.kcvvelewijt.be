import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StaffDetailLoading from "./loading";

const meta = {
  title: "Pages/Staff/StaffDetailSkeleton",
  component: StaffDetailLoading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof StaffDetailLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
