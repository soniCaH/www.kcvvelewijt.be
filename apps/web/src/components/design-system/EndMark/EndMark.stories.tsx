import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EndMark } from "./EndMark";

const meta = {
  title: "UI/EndMark",
  component: EndMark,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge border p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EndMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { label: "EINDE GESPREK" },
};

export const Default: Story = {
  args: { label: "EINDE GESPREK" },
};

export const EindeInterview: Story = {
  args: { label: "EINDE INTERVIEW" },
};

export const EindeLogboek: Story = {
  args: { label: "EINDE LOGBOEK" },
};

export const EindeShort: Story = {
  args: { label: "EINDE" },
};

/**
 * Visual verification overlay — guides at the wrapper centerline so a reviewer
 * can confirm the rule, both stars, and the cap-height midpoint of the label
 * all touch the same horizontal line.
 */
export const AlignmentProof: Story = {
  args: { label: "EINDE GESPREK" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge relative border p-12">
        <Story />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-12 top-1/2 h-px bg-fuchsia-500/60"
        />
      </div>
    ),
  ],
};
