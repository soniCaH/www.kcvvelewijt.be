import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DashedDivider, Divider, DottedDivider, SolidDivider } from "./Divider";

const meta = {
  title: "UI/Divider",
  component: Divider,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { style: "solid", color: "ink", inset: false },
};

export const Solid: Story = {
  args: { style: "solid", color: "ink" },
};

export const Dashed: Story = {
  args: { style: "dashed", color: "ink" },
};

export const Dotted: Story = {
  args: { style: "dotted", color: "ink" },
};

export const PaperEdgeColor: Story = {
  args: { style: "solid", color: "paper-edge" },
};

export const Inset: Story = {
  args: { style: "dashed", color: "ink", inset: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-ink mb-2 text-sm">Solid (ink)</p>
        <SolidDivider />
      </div>
      <div>
        <p className="text-ink mb-2 text-sm">Dashed (ink)</p>
        <DashedDivider />
      </div>
      <div>
        <p className="text-ink mb-2 text-sm">Dotted (ink)</p>
        <DottedDivider />
      </div>
      <div>
        <p className="text-ink mb-2 text-sm">Solid (paper-edge)</p>
        <SolidDivider color="paper-edge" />
      </div>
      <div>
        <p className="text-ink mb-2 text-sm">Dashed (paper-edge)</p>
        <DashedDivider color="paper-edge" />
      </div>
      <div>
        <p className="text-ink mb-2 text-sm">Dotted (paper-edge)</p>
        <DottedDivider color="paper-edge" />
      </div>
      <div>
        <p className="text-ink mb-2 text-sm">Dashed inset</p>
        <DashedDivider inset />
      </div>
    </div>
  ),
};
