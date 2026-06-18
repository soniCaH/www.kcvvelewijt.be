import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MockBackdrop } from "../storybook-mocks";
import { SectionTransition } from "./SectionTransition";

const meta = {
  title: "UI/SectionTransition",
  component: SectionTransition,
  // `vr` opts this file into VR — see apps/web/.storybook/test-runner.ts.
  tags: ["autodocs", "vr"],
  args: {
    type: "striped-seam",
    direction: "horizontal",
    height: "md",
    colorPair: "ink-cream",
  },
  argTypes: {
    direction: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    height: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "Forwarded to <StripedSeam>.",
    },
    colorPair: {
      control: "select",
      options: [
        "ink-cream",
        "jersey-cream",
        "jersey-tonal-dark",
        "cream-jersey-deep",
      ],
      description: "Forwarded to <StripedSeam>.",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "100vw" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// ─── Horizontal seams ─────────────────────────────────────────────────────────

export const HorizontalDefault: Story = {
  name: "Horizontal — ink-cream · md",
  decorators: [
    (Story) => (
      <div className="flex flex-col">
        <div className="bg-cream h-32 w-full" />
        <Story />
        <div className="bg-jersey-deep h-32 w-full" />
      </div>
    ),
  ],
  args: {
    type: "striped-seam",
    direction: "horizontal",
    height: "md",
    colorPair: "ink-cream",
  },
};

export const HorizontalCreamJerseyXl: Story = {
  name: "Horizontal — cream-jersey-deep · xl",
  decorators: [
    (Story) => (
      <div className="flex flex-col">
        <div className="bg-cream h-32 w-full" />
        <Story />
        <div className="bg-jersey-deep h-32 w-full" />
      </div>
    ),
  ],
  args: {
    type: "striped-seam",
    direction: "horizontal",
    height: "xl",
    colorPair: "cream-jersey-deep",
  },
};

export const HorizontalJerseyTonalDark: Story = {
  name: "Horizontal — jersey-tonal-dark · lg (clubshop frame)",
  decorators: [
    (Story) => (
      <div className="flex flex-col">
        <div className="bg-jersey-deep-dark h-32 w-full" />
        <Story />
        <div className="bg-jersey-deep h-32 w-full" />
      </div>
    ),
  ],
  args: {
    type: "striped-seam",
    direction: "horizontal",
    height: "lg",
    colorPair: "jersey-tonal-dark",
  },
};

export const BetweenBackdrops: Story = {
  name: "Between backdrops (transparent SVG bleeds through)",
  parameters: {
    docs: {
      description: {
        story:
          "`<StripedSeam>` is a transparent SVG, so neighbour-section backdrops bleed through the seam naturally — no per-side fill juggling. The bleed-through is geometry-driven, not flag-driven. The mock visual is shared with `UI/SectionStack` via `../storybook-mocks`.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative flex flex-col">
        <div className="bg-cream relative h-40 w-full">
          <MockBackdrop label="Backdrop A" />
        </div>
        <Story />
        <div className="bg-jersey-deep relative h-40 w-full">
          <MockBackdrop label="Backdrop B" />
        </div>
      </div>
    ),
  ],
  args: {
    type: "striped-seam",
    direction: "horizontal",
    height: "lg",
    colorPair: "ink-cream",
  },
};

// ─── Vertical seam (column divider) ─────────────────────────────────────────────

export const Vertical: Story = {
  name: "Vertical — jersey-cream · md (column seam)",
  decorators: [
    (Story) => (
      <div className="flex h-[200px] flex-row">
        <div className="bg-cream h-full w-1/2" />
        <Story />
        <div className="bg-jersey-deep h-full w-1/2" />
      </div>
    ),
  ],
  args: {
    type: "striped-seam",
    direction: "vertical",
    height: "md",
    colorPair: "jersey-cream",
  },
};
