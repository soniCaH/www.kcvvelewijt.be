import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchStatusBadge } from "./MatchStatusBadge";

const meta = {
  title: "Features/Match/MatchStatusBadge",
  component: MatchStatusBadge,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream-soft border-paper-edge inline-block border p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatchStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Postponed: Story = { args: { status: "postponed" } };
export const Stopped: Story = { args: { status: "stopped" } };
export const Forfeited: Story = { args: { status: "forfeited" } };

export const AllStatuses: Story = {
  args: { status: "postponed" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <MatchStatusBadge status="postponed" />
      <MatchStatusBadge status="stopped" />
      <MatchStatusBadge status="forfeited" />
    </div>
  ),
};

export const OnInkSurface: Story = {
  args: { status: "postponed" },
  decorators: [
    (Story) => (
      <div className="bg-ink p-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <MatchStatusBadge status="postponed" isDark />
      <MatchStatusBadge status="stopped" isDark />
      <MatchStatusBadge status="forfeited" isDark />
    </div>
  ),
};

export const HiddenForScheduledStatus: Story = {
  // Returns null — story renders nothing meaningful, vr-skip avoids capturing
  // a 0×0 frame.
  tags: ["vr-skip"],
  args: { status: "scheduled" },
};
