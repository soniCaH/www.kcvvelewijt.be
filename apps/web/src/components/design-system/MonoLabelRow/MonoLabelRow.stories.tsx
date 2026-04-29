import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MonoLabelRow } from "./MonoLabelRow";

const meta = {
  title: "UI/MonoLabelRow",
  component: MonoLabelRow,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MonoLabelRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    items: [
      { label: "MATCHVERSLAG" },
      { label: "A-PLOEG" },
      { label: "8 MIN" },
    ],
  },
};

export const Default: Story = {
  args: {
    items: [
      { label: "MATCHVERSLAG" },
      { label: "A-PLOEG" },
      { label: "8 MIN" },
    ],
  },
};

export const MixedVariants: Story = {
  args: {
    items: [
      { label: "JEUGD", variant: "pill-jersey" },
      { label: "U15", variant: "pill-ink" },
      { label: "PROVINCIAAL", variant: "plain" },
    ],
  },
};

export const WithStarDivider: Story = {
  args: {
    divider: "★",
    items: [{ label: "VERSLAG" }, { label: "23 APR" }, { label: "EINDSTAND" }],
  },
};

export const WithPipeDivider: Story = {
  args: {
    divider: "|",
    items: [{ label: "INTERVIEW" }, { label: "DUO" }, { label: "12 MIN" }],
  },
};

export const LongRowWraps: Story = {
  args: {
    items: [
      { label: "MATCHVERSLAG" },
      { label: "A-PLOEG" },
      { label: "DERBY" },
      { label: "PROVINCIAAL" },
      { label: "23 APR 26" },
      { label: "EINDSTAND 3-1" },
    ],
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export const OrderedList: Story = {
  args: {
    as: "ol",
    items: [
      { label: "STAMNR. 55", variant: "pill-cream" },
      { label: "SINDS 1909", variant: "pill-cream" },
    ],
  },
};
