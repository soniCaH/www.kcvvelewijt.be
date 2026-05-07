import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShieldFigure } from "./ShieldFigure";

const meta = {
  title: "UI/ShieldFigure",
  component: ShieldFigure,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge inline-flex items-center gap-4 border p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ShieldFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const KcvvInitial: Story = {
  args: { variant: "kcvv", name: "KCVV", size: "md" },
};

export const OpponentInitial: Story = {
  args: { variant: "opponent", name: "RC Mechelen", size: "md" },
};

export const KcvvSmall: Story = {
  args: { variant: "kcvv", name: "KCVV", size: "sm" },
};

export const OpponentSmall: Story = {
  args: { variant: "opponent", name: "VK De Volharding", size: "sm" },
};

export const OpponentWithLogo: Story = {
  args: {
    variant: "opponent",
    name: "RC Mechelen",
    size: "md",
    logoUrl: "/images/logos/kcvv-logo.png",
  },
};
