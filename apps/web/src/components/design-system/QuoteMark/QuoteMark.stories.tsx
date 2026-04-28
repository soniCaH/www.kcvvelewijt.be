import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QuoteMark } from "./QuoteMark";

const meta = {
  title: "UI/QuoteMark",
  component: QuoteMark,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream flex items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuoteMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { color: "jersey" },
};

export const JerseyOnCream: Story = {
  args: { color: "jersey" },
};

export const InkOnCream: Story = {
  args: { color: "ink" },
};

export const CreamOnInk: Story = {
  args: { color: "cream" },
  decorators: [
    (Story) => (
      <div className="bg-ink flex items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
};

export const JerseyOnInk: Story = {
  args: { color: "jersey" },
  decorators: [
    (Story) => (
      <div className="bg-ink flex items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
};

export const AllColours: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <QuoteMark color="jersey" />
      <QuoteMark color="ink" />
      <div className="bg-ink p-2">
        <QuoteMark color="cream" />
      </div>
    </div>
  ),
};
