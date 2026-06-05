import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { RemovableChip } from "./RemovableChip";

const meta = {
  title: "UI/RemovableChip",
  component: RemovableChip,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream border-paper-edge border-2 p-8">
        <Story />
      </div>
    ),
  ],
  args: { onRemove: fn(), label: "A-ploeg" },
} satisfies Meta<typeof RemovableChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ink: Story = {};

export const Outline: Story = {
  args: { tone: "outline" },
};

export const Row: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <RemovableChip {...args} label="A-ploeg" />
      <RemovableChip {...args} label="U15 A" />
      <RemovableChip {...args} label="B-ploeg" tone="outline" />
    </div>
  ),
};
