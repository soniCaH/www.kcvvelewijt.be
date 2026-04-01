import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ClubPageLoading from "./loading";

const meta = {
  title: "Pages/Club/ClubPageSkeleton",
  component: ClubPageLoading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ClubPageLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
