import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TapeStrip } from "./TapeStrip";

const meta = {
  title: "UI/TapeStrip",
  component: TapeStrip,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge relative h-40 w-64 border">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TapeStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { color: "jersey", position: "tl", length: "md" },
};

export const AllPositions: Story = {
  render: () => (
    <>
      <TapeStrip position="tl" />
      <TapeStrip position="tr" />
      <TapeStrip position="bl" />
      <TapeStrip position="br" />
    </>
  ),
};

export const InkColor: Story = { args: { color: "ink" } };
export const CreamColor: Story = { args: { color: "cream" } };
export const LongLength: Story = { args: { length: "lg" } };
export const ShortLength: Story = { args: { length: "sm" } };
export const CustomRotation: Story = { args: { rotation: -25 } };
