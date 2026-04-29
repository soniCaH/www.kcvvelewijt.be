import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";
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

const slotStyle = (rot: string) =>
  ({ "--tape-rotation": rot }) as CSSProperties;

export const AutoVaryViaGridVariable: Story = {
  // The grid pool TapedCardGrid uses: -3deg, -4deg, -5deg, -6deg.
  // Standalone tapes default to -5deg.
  render: () => (
    <div className="flex flex-col gap-4">
      {(["-3deg", "-4deg", "-5deg", "-6deg"] as const).map((rot) => (
        <div
          key={rot}
          style={slotStyle(rot)}
          className="bg-cream-soft border-paper-edge relative h-20 w-64 border"
        >
          <TapeStrip />
          <span className="text-mono-sm absolute bottom-2 left-2 font-mono uppercase">
            --tape-rotation: {rot}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const InkColor: Story = { args: { color: "ink" } };
export const CreamColor: Story = { args: { color: "cream" } };
export const LongLength: Story = { args: { length: "lg" } };
export const ShortLength: Story = { args: { length: "sm" } };
