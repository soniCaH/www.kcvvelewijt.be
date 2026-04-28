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
