import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SearchLoading from "./loading";

const meta = {
  title: "Pages/Search/SearchSkeleton",
  component: SearchLoading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SearchLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
