import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamsCta } from "./TeamsCta";

const meta = {
  title: "Features/Teams/TeamsCta",
  component: TeamsCta,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-100 py-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TeamsCta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
