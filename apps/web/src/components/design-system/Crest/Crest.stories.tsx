import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Crest } from "./Crest";

const meta = {
  title: "UI/Crest",
  component: Crest,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream border-paper-edge border-2 p-8">
        <Story />
      </div>
    ),
  ],
  args: { name: "Anderlecht" },
} satisfies Meta<typeof Crest>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Logo present — rendered as a (decorative) club crest image. */
export const WithLogo: Story = {
  args: { logo: "/images/logo-flat.png" },
};

/** No logo — initialled outline disc fallback. */
export const Fallback: Story = {};

/** Empty name + no logo — the `·` placeholder glyph. */
export const FallbackEmptyName: Story = {
  args: { name: "" },
};

/** The disc glyph scales with the `size` prop (16 / 18 / 20 / 28px). */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Crest {...args} size={16} />
      <Crest {...args} size={18} />
      <Crest {...args} size={20} />
      <Crest {...args} size={28} />
    </div>
  ),
};
