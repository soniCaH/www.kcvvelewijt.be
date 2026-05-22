import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchStatusBadge } from "./MatchStatusBadge";

const meta = {
  title: "Features/Matches/MatchStatusBadge",
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

export const Finished: Story = { args: { status: "finished" } };
export const Forfeited: Story = { args: { status: "forfeited" } };
export const Postponed: Story = { args: { status: "postponed" } };
export const Stopped: Story = { args: { status: "stopped" } };
export const Cancelled: Story = { args: { status: "cancelled" } };

export const AllStatuses: Story = {
  args: { status: "finished" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <MatchStatusBadge status="finished" />
      <MatchStatusBadge status="forfeited" />
      <MatchStatusBadge status="postponed" />
      <MatchStatusBadge status="stopped" />
      <MatchStatusBadge status="cancelled" />
    </div>
  ),
};

export const OnInkSurface: Story = {
  args: { status: "finished" },
  decorators: [
    (Story) => (
      <div className="bg-ink p-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <MatchStatusBadge status="finished" />
      <MatchStatusBadge status="forfeited" />
      <MatchStatusBadge status="postponed" />
      <MatchStatusBadge status="stopped" />
      <MatchStatusBadge status="cancelled" />
    </div>
  ),
};

/**
 * Preview of the locked Phase 6.B corner-stamp placement — badge sits at the
 * top-right of a paper-card with a slight overlap into the top border. The
 * real `<MatchHero>` mounts the badge unconditionally; this story documents
 * the placement so consumers don't reinvent it.
 */
export const OnMatchHeroCornerStamp: Story = {
  args: { status: "cancelled" },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="bg-cream p-12">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="relative inline-block">
      <div className="bg-cream border-ink shadow-paper-md h-40 w-80 border-2 p-6">
        <div className="font-display text-display-md text-ink">
          KCVV — RAEC Mons
        </div>
        <div className="text-ink-muted mt-2 font-mono text-xs tracking-[0.16em] uppercase">
          Zaterdag 21:00 · Stamford
        </div>
      </div>
      <div className="absolute -top-3 right-4 rotate-[2deg]">
        <MatchStatusBadge status="cancelled" />
      </div>
    </div>
  ),
};

export const HiddenForScheduledStatus: Story = {
  tags: ["vr-skip"],
  args: { status: "scheduled" },
};
