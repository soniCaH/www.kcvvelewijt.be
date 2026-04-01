import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import JeugdLoading from "./loading";

const meta = {
  title: "Pages/Jeugd/JeugdLandingSkeleton",
  component: JeugdLoading,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof JeugdLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
