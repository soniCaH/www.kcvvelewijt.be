/**
 * HorizontalSlider Component Stories
 * Generic horizontal scroll container with prev/next arrows
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HorizontalSlider } from "./HorizontalSlider";

const SampleCard = ({ label, color }: { label: string; color: string }) => (
  <div
    className="w-64 h-32 shrink-0 rounded-lg flex items-center justify-center text-white font-bold text-lg"
    style={{ backgroundColor: color }}
  >
    {label}
  </div>
);

const fewItems = (
  <>
    <SampleCard label="Card 1" color="var(--color-kcvv-green-dark)" />
    <SampleCard label="Card 2" color="var(--color-kcvv-black)" />
    <SampleCard label="Card 3" color="var(--color-kcvv-gray-blue)" />
  </>
);

const manyItems = (
  <>
    <SampleCard label="Card 1" color="var(--color-kcvv-green-dark)" />
    <SampleCard label="Card 2" color="var(--color-kcvv-black)" />
    <SampleCard label="Card 3" color="var(--color-kcvv-gray-blue)" />
    <SampleCard label="Card 4" color="var(--color-kcvv-gray-dark)" />
    <SampleCard label="Card 5" color="var(--color-kcvv-green)" />
    <SampleCard label="Card 6" color="var(--color-kcvv-green-hover-dark)" />
    <SampleCard label="Card 7" color="var(--color-kcvv-gray)" />
    <SampleCard label="Card 8" color="var(--color-kcvv-green-hover)" />
  </>
);

const meta = {
  title: "UI/HorizontalSlider",
  component: HorizontalSlider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A generic horizontal scroll container with smooth scrolling, hidden scrollbar, and prev/next chevron arrows. Supports light and dark theme variants.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof HorizontalSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground — adjust props in the controls panel. */
export const Playground: Story = {
  args: {
    title: "Horizontal Slider",
    theme: "light",
    children: manyItems,
  },
};

/** Few items — arrows may not appear if all items fit the viewport. */
export const FewItems: Story = {
  args: {
    title: "Drie items",
    children: fewItems,
  },
};

/** Many items — scroll arrows appear to navigate. */
export const ManyItems: Story = {
  args: {
    title: "Acht items",
    children: manyItems,
  },
};

/** Dark theme variant with green accent arrows. */
export const DarkTheme: Story = {
  args: {
    title: "Dark Theme",
    theme: "dark",
    children: manyItems,
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

/** No title — slider renders without a heading. */
export const NoTitle: Story = {
  args: {
    children: manyItems,
  },
};
