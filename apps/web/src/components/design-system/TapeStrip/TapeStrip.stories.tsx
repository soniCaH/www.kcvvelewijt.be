import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties, ReactNode } from "react";
import { TapeStrip } from "./TapeStrip";

const meta = {
  title: "UI/TapeStrip",
  component: TapeStrip,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof TapeStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Shared cream-soft panel decorator. Applied per-story rather than via
// meta.decorators so layout-heavy stories (AutoVaryViaGridVariables) and
// surface-swap stories (WarmOnJerseyDeep) can opt out without the wrapper
// bleeding through inter-slot gaps or the wrong background colour.
const panelDecorator = (Story: () => ReactNode) => (
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
);

export const Playground: Story = {
  args: { color: "jersey", length: "md" },
  decorators: [panelDecorator],
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

export const InkColor: Story = {
  args: { color: "ink" },
  decorators: [panelDecorator],
};
export const CreamColor: Story = {
  args: { color: "cream" },
  decorators: [panelDecorator],
};
export const LongLength: Story = {
  args: { length: "lg" },
  decorators: [panelDecorator],
};
export const ShortLength: Story = {
  args: { length: "sm" },
  decorators: [panelDecorator],
};

// Right-anchored tape — R10 (#1748). Used on the outer NewsCard frame
// for the top-right corner pairing the top-left strip.
export const PositionRight: Story = {
  args: { color: "jersey", length: "md", position: "right" },
  decorators: [panelDecorator],
};

// Both strips composed on a single panel — exactly the NewsCard pairing:
// warm tape at TL + jersey tape at TR. Demonstrates that the two
// position anchors read independent CSS variables.
export const CornerPair: Story = {
  render: () => (
    <div
      style={
        {
          "--tape-rotation": "var(--rotate-tape-a)",
          "--tape-left": "8%",
          "--tape-right": "8%",
        } as CSSProperties
      }
      className="bg-cream-soft border-paper-edge relative h-40 w-72 border"
    >
      <TapeStrip color="warm" length="md" position="left" />
      <TapeStrip color="jersey" length="md" position="right" />
    </div>
  ),
};

// Warm-yellow tape on a jersey-deep panel — the contrast pairing this
// variant exists for. <FeaturedEventBand> (#1677) is the first consumer.
// The `bg-jersey-deep` + `border-jersey-deep-dark` utilities double as the
// smoke test that the new tokens (#1697) reach Tailwind via `@theme` —
// if either utility doesn't generate, the panel renders unstyled.
export const WarmOnJerseyDeep: Story = {
  args: { color: "warm", length: "lg" },
  decorators: [
    (Story) => (
      <div
        style={
          {
            "--tape-rotation": "var(--rotate-tape-a)",
            "--tape-left": "12%",
          } as CSSProperties
        }
        className="bg-jersey-deep border-jersey-deep-dark relative h-40 w-64 border"
      >
        <Story />
      </div>
    ),
  ],
};
