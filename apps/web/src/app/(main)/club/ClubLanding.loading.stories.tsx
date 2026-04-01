import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ClubLoading from "./loading";

const meta = {
  title: "Pages/Club/ClubLandingSkeleton",
  component: ClubLoading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ClubLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
