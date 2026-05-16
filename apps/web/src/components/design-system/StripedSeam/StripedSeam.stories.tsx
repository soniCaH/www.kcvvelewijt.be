import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StripedSeam } from "./StripedSeam";

const meta = {
  title: "UI/StripedSeam",
  component: StripedSeam,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StripedSeam>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { direction: "horizontal", height: "md", colorPair: "ink-cream" },
};

export const HeightSm: Story = {
  args: { direction: "horizontal", height: "sm", colorPair: "ink-cream" },
};

export const HeightMd: Story = {
  args: { direction: "horizontal", height: "md", colorPair: "ink-cream" },
};

export const HeightLg: Story = {
  args: { direction: "horizontal", height: "lg", colorPair: "ink-cream" },
};

export const JerseyCream: Story = {
  args: { direction: "horizontal", height: "md", colorPair: "jersey-cream" },
};

export const Vertical: Story = {
  args: { direction: "vertical", height: "md", colorPair: "ink-cream" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft h-48 w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

// `xl` height — 28px tall. Added in R5.B to match the YouthSection
// top-frame brief target.
export const HeightXl: Story = {
  args: { direction: "horizontal", height: "xl", colorPair: "ink-cream" },
};

// `jersey-tonal-dark` — jersey-deep-dark + jersey-deep alternating.
// Used on the R6.C Clubshop section's mirrored top + bottom frame
// against a `bg-jersey-deep-dark` surface. The wrapper decorator
// swaps to that surface so the seam reads as intended (the default
// cream wrapper would make the dark stops disappear).
export const JerseyTonalDark: Story = {
  args: {
    direction: "horizontal",
    height: "md",
    colorPair: "jersey-tonal-dark",
  },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

// `cream-jersey-deep` — cream + jersey-deep alternating. Reads as
// masking-tape laid across a dark green field. Used on the R5.B
// YouthSection top frame; demoed here against a `bg-jersey-deep`
// surface so the cream stops carry the intended contrast.
export const CreamJerseyDeep: Story = {
  args: {
    direction: "horizontal",
    height: "xl",
    colorPair: "cream-jersey-deep",
  },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

// `flip` — mirrors the diagonal angle from -45° to +45°. Used as the
// bottom seam of a mirrored frame (R6.C Clubshop) so the two seams
// lean toward each other.
export const Flipped: Story = {
  args: {
    direction: "horizontal",
    height: "md",
    colorPair: "jersey-tonal-dark",
    flip: true,
  },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};
