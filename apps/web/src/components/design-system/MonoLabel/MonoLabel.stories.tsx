import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MonoLabel } from "./MonoLabel";

const meta = {
  title: "UI/MonoLabel",
  component: MonoLabel,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge inline-block border p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MonoLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { variant: "plain", size: "sm", children: "INTERVIEW" },
};

export const PlainSm: Story = {
  args: { variant: "plain", size: "sm", children: "INTERVIEW" },
};

export const PlainMd: Story = {
  args: { variant: "plain", size: "md", children: "MATCHVERSLAG" },
};

export const PillJerseySm: Story = {
  args: { variant: "pill-jersey", size: "sm", children: "JEUGD ⋅ U15" },
};

export const PillJerseyMd: Story = {
  args: { variant: "pill-jersey", size: "md", children: "JEUGD ⋅ U15" },
};

export const PillInkSm: Story = {
  args: { variant: "pill-ink", size: "sm", children: "8 MIN" },
};

export const PillInkMd: Story = {
  args: { variant: "pill-ink", size: "md", children: "8 MIN" },
};

export const PillCreamSm: Story = {
  args: { variant: "pill-cream", size: "sm", children: "NIEUW" },
};

export const PillCreamMd: Story = {
  args: { variant: "pill-cream", size: "md", children: "NIEUW" },
};

export const VariantSizeMatrixOnCream: Story = {
  args: { children: "X" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="grid grid-cols-2 items-start gap-x-8 gap-y-4">
      <MonoLabel variant="plain" size="sm">
        INTERVIEW
      </MonoLabel>
      <MonoLabel variant="plain" size="md">
        MATCHVERSLAG
      </MonoLabel>
      <MonoLabel variant="pill-jersey" size="sm">
        JEUGD ⋅ U15
      </MonoLabel>
      <MonoLabel variant="pill-jersey" size="md">
        JEUGD ⋅ U15
      </MonoLabel>
      <MonoLabel variant="pill-ink" size="sm">
        8 MIN
      </MonoLabel>
      <MonoLabel variant="pill-ink" size="md">
        8 MIN
      </MonoLabel>
      <MonoLabel variant="pill-cream" size="sm">
        NIEUW
      </MonoLabel>
      <MonoLabel variant="pill-cream" size="md">
        NIEUW
      </MonoLabel>
    </div>
  ),
};

export const VariantSizeMatrixOnInk: Story = {
  args: { children: "X" },
  decorators: [
    (Story) => (
      <div className="bg-ink border-paper-edge border p-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="grid grid-cols-2 items-start gap-x-8 gap-y-4">
      <MonoLabel variant="plain" size="sm">
        KAMPIOEN.
      </MonoLabel>
      <MonoLabel variant="plain" size="md">
        KAMPIOEN.
      </MonoLabel>
      <MonoLabel variant="pill-jersey" size="sm">
        TRANSFER ⋅ INCOMING
      </MonoLabel>
      <MonoLabel variant="pill-jersey" size="md">
        TRANSFER ⋅ INCOMING
      </MonoLabel>
      <MonoLabel variant="pill-ink" size="sm">
        8 MIN
      </MonoLabel>
      <MonoLabel variant="pill-ink" size="md">
        8 MIN
      </MonoLabel>
      <MonoLabel variant="pill-cream" size="sm">
        NIEUW
      </MonoLabel>
      <MonoLabel variant="pill-cream" size="md">
        NIEUW
      </MonoLabel>
    </div>
  ),
};

export const DutchSamplesOnCream: Story = {
  args: { children: "X" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <MonoLabel variant="plain">INTERVIEW</MonoLabel>
      <MonoLabel variant="pill-ink">MATCHVERSLAG</MonoLabel>
      <MonoLabel variant="pill-jersey">JEUGD ⋅ U15</MonoLabel>
      <MonoLabel variant="pill-cream">8 MIN</MonoLabel>
      <MonoLabel variant="pill-jersey" size="md">
        NIEUW
      </MonoLabel>
      <MonoLabel variant="plain" size="md">
        KAMPIOEN.
      </MonoLabel>
      <MonoLabel variant="pill-ink" size="md">
        TRANSFER ⋅ INCOMING
      </MonoLabel>
    </div>
  ),
};

export const DutchSamplesOnInk: Story = {
  args: { children: "X" },
  decorators: [
    (Story) => (
      <div className="bg-ink border-paper-edge text-cream border p-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <MonoLabel variant="pill-cream">INTERVIEW</MonoLabel>
      <MonoLabel variant="pill-jersey">MATCHVERSLAG</MonoLabel>
      <MonoLabel variant="pill-jersey" size="md">
        JEUGD ⋅ U15
      </MonoLabel>
      <MonoLabel variant="pill-cream">8 MIN</MonoLabel>
      <MonoLabel variant="pill-jersey" size="md">
        NIEUW
      </MonoLabel>
      <MonoLabel variant="pill-cream" size="md">
        KAMPIOEN.
      </MonoLabel>
      <MonoLabel variant="pill-jersey" size="md">
        TRANSFER ⋅ INCOMING
      </MonoLabel>
    </div>
  ),
};
