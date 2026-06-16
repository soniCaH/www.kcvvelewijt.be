import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DashedDivider, DottedDivider } from "./Divider";

const meta = {
  title: "UI/Divider",
  component: DottedDivider,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-full max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DottedDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dotted: Story = {
  args: { color: "ink" },
};

export const Dashed: Story = {
  render: (args) => <DashedDivider {...args} />,
  args: { color: "ink" },
};

export const PaperEdgeColor: Story = {
  args: { color: "paper-edge" },
};

export const Inset: Story = {
  render: (args) => <DashedDivider {...args} />,
  args: { color: "ink", inset: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-ink mb-2 text-sm">Dashed (ink)</p>
        <DashedDivider />
      </div>
      <div>
        <p className="text-ink mb-2 text-sm">Dotted (ink)</p>
        <DottedDivider />
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
