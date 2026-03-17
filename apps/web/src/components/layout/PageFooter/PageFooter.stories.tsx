import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageFooter } from "./PageFooter";

const meta = {
  title: "Layout/PageFooter",
  component: PageFooter,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PageFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-600">Page content above footer</p>
      </div>
      <PageFooter />
    </div>
  ),
};

export const Standalone: Story = {
  args: {},
};
