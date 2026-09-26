import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ClubLoading from "./loading";

const meta = {
  title: "Pages/Club/ClubLandingSkeleton",
  component: ClubLoading,
  tags: ["autodocs", "pages-a11y"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ClubLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
