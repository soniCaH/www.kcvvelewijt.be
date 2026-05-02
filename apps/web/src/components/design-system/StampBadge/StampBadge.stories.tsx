import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StampBadge } from "./StampBadge";

const meta = {
  title: "UI/StampBadge",
  component: StampBadge,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      // The badge is absolutely positioned — give it a relative host
      // surface so the stories visualise the real layout context.
      <div className="bg-cream-soft border-paper-edge relative inline-block min-h-[140px] min-w-[360px] border-2 p-8">
        <p className="text-ink-muted font-mono text-[11px] tracking-[0.08em] uppercase">
          Host surface
        </p>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StampBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: "INSCHRIJVING",
    tone: "jersey",
    position: "top-right",
    rotation: 2,
  },
};

export const JerseyTopRight: Story = {
  args: { children: "INSCHRIJVING", tone: "jersey", position: "top-right" },
};

export const InkVariant: Story = {
  args: { children: "ARCHIEF", tone: "ink", position: "top-right" },
};

export const AlertVolzet: Story = {
  args: { children: "VOLZET", tone: "alert", position: "top-right" },
};

export const WithStarGlyph: Story = {
  args: {
    children: <>★ INSCHRIJVING</>,
    tone: "jersey",
    position: "top-right",
  },
};

export const TopLeftPosition: Story = {
  args: {
    children: "GEANNULEERD",
    tone: "alert",
    position: "top-left",
    rotation: -3,
  },
};
