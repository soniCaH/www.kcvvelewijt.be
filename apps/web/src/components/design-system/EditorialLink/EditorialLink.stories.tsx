import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorialLink } from "./EditorialLink";

const meta = {
  title: "UI/EditorialLink",
  component: EditorialLink,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge inline-block border p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorialLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    href: "/news",
    children: "Lees meer",
    variant: "inline",
    tone: "light",
  },
};

export const InlineLight: Story = {
  args: {
    href: "/news",
    variant: "inline",
    tone: "light",
    children: "Lees meer",
  },
};

export const InlineLightWithArrow: Story = {
  args: {
    href: "/news",
    variant: "inline",
    tone: "light",
    withArrow: true,
    children: "Lees meer",
  },
};

export const InlineDark: Story = {
  args: {
    href: "/news",
    variant: "inline",
    tone: "dark",
    children: "Lees meer",
  },
  decorators: [
    (Story) => (
      <div className="bg-ink border-paper-edge inline-block border p-6">
        <Story />
      </div>
    ),
  ],
};

export const CtaLight: Story = {
  args: {
    href: "/nieuws",
    variant: "cta",
    tone: "light",
    children: "BEKIJK ALLE NIEUWS",
  },
};

export const CtaLightNoArrow: Story = {
  args: {
    href: "/nieuws",
    variant: "cta",
    tone: "light",
    withArrow: false,
    children: "BEKIJK ALLE NIEUWS",
  },
};

export const CtaDark: Story = {
  args: {
    href: "/nieuws",
    variant: "cta",
    tone: "dark",
    children: "BEKIJK ALLE NIEUWS",
  },
  decorators: [
    (Story) => (
      <div className="bg-ink border-paper-edge inline-block border p-6">
        <Story />
      </div>
    ),
  ],
};

export const MatrixOnCream: Story = {
  args: { href: "/x", children: "X" },
  render: () => (
    <div className="grid grid-cols-2 items-start gap-x-10 gap-y-6">
      <EditorialLink href="/x" variant="inline">
        Lees meer
      </EditorialLink>
      <EditorialLink href="/x" variant="inline" withArrow>
        Lees meer
      </EditorialLink>
      <EditorialLink href="/x" variant="cta">
        BEKIJK ALLE NIEUWS
      </EditorialLink>
      <EditorialLink href="/x" variant="cta" withArrow={false}>
        BEKIJK ALLE NIEUWS
      </EditorialLink>
    </div>
  ),
};

export const MatrixOnInk: Story = {
  args: { href: "/x", children: "X" },
  decorators: [
    (Story) => (
      <div className="bg-ink border-paper-edge text-cream border p-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="grid grid-cols-2 items-start gap-x-10 gap-y-6">
      <EditorialLink href="/x" variant="inline" tone="dark">
        Lees meer
      </EditorialLink>
      <EditorialLink href="/x" variant="inline" tone="dark" withArrow>
        Lees meer
      </EditorialLink>
      <EditorialLink href="/x" variant="cta" tone="dark">
        BEKIJK ALLE NIEUWS
      </EditorialLink>
      <EditorialLink href="/x" variant="cta" tone="dark" withArrow={false}>
        BEKIJK ALLE NIEUWS
      </EditorialLink>
    </div>
  ),
};
