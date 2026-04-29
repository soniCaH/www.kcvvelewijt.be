import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NumberDisplay } from "./NumberDisplay";

const meta = {
  title: "UI/NumberDisplay",
  component: NumberDisplay,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge inline-block border p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NumberDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    value: 8,
    prefix: "#",
    size: "display-xl",
    tone: "ink",
    label: "WEDSTRIJDEN",
    as: "div",
  },
};

export const JerseyNumber: Story = {
  args: { value: 8, prefix: "#", size: "display-2xl", tone: "jersey" },
};

export const StatCounter: Story = {
  args: {
    value: 28,
    size: "display-xl",
    tone: "ink",
    label: "WEDSTRIJDEN",
    as: "div",
  },
};

export const YearMarker: Story = {
  args: { value: 2374, size: "display-lg", tone: "jersey-deep" },
};

export const WithPrefix: Story = {
  args: { value: 55, prefix: "nr.", size: "display-xl", tone: "ink" },
};

export const WithSuffix: Story = {
  args: { value: 28, suffix: "+", size: "display-xl", tone: "jersey-deep" },
};

export const LabeledRow: Story = {
  args: { value: 0 },
  render: () => (
    <div className="flex flex-wrap items-end gap-10">
      <NumberDisplay
        as="div"
        value={28}
        size="display-xl"
        tone="ink"
        label="WEDSTRIJDEN"
      />
      <NumberDisplay
        as="div"
        value={12}
        size="display-xl"
        tone="ink"
        label="GOALS"
      />
      <NumberDisplay
        as="div"
        value={5}
        size="display-xl"
        tone="ink"
        label="ASSISTS"
      />
      <NumberDisplay
        as="div"
        value={1090}
        size="display-xl"
        tone="ink"
        label="MINUTEN"
      />
    </div>
  ),
};

export const ToneCreamOnInk: Story = {
  args: { value: 8, prefix: "#" },
  render: () => (
    <div className="bg-ink p-8">
      <NumberDisplay value={8} prefix="#" size="display-2xl" tone="cream" />
    </div>
  ),
};
