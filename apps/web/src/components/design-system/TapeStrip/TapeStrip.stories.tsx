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
      // Pin --tape-rotation and --tape-left so client-side navigation between
      // stories (e.g. from AutoVaryViaGridVariables which sets these inline)
      // cannot leak a stale value into subsequent story screenshots.
      <div
        style={
          {
            "--tape-rotation": "var(--rotate-tape-a)",
            "--tape-left": "12%",
          } as CSSProperties
        }
        className="bg-cream-soft border-paper-edge relative h-40 w-64 border"
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TapeStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { color: "jersey", length: "md" },
};

const slotStyle = (left: string, rot: string) =>
  ({
    "--tape-left": left,
    "--tape-rotation": rot,
  }) as CSSProperties;

export const AutoVaryViaGridVariables: Story = {
  // The grid pools <TapedCardGrid> uses:
  //   --tape-rotation: -3deg / -4deg / -5deg / -6deg
  //   --tape-left:     4%    / 7%    / 10%   / 12%
  // Standalone tapes default to -5deg / 12%.
  render: () => {
    const slots = [
      { left: "4%", rot: "-3deg" },
      { left: "7%", rot: "-4deg" },
      { left: "10%", rot: "-5deg" },
      { left: "12%", rot: "-6deg" },
    ];
    return (
      <div className="flex flex-col gap-4">
        {slots.map(({ left, rot }) => (
          <div
            key={`${left}-${rot}`}
            style={slotStyle(left, rot)}
            className="bg-cream-soft border-paper-edge relative h-20 w-64 border"
          >
            <TapeStrip />
            <span className="text-mono-sm absolute bottom-2 left-2 font-mono uppercase">
              left {left} · rot {rot}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

export const InkColor: Story = { args: { color: "ink" } };
export const CreamColor: Story = { args: { color: "cream" } };
export const LongLength: Story = { args: { length: "lg" } };
export const ShortLength: Story = { args: { length: "sm" } };
