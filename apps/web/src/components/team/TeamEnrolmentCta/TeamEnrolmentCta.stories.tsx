import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamEnrolmentCta } from "./TeamEnrolmentCta";

const meta = {
  title: "Features/Teams/TeamEnrolmentCta",
  component: TeamEnrolmentCta,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs", "vr"],
  // Mirror the on-page frame: the CTA mounts inside the team page's
  // `sectionClass` (max-w-5xl, px-4 py-10) on the cream page background, so the
  // jersey-deep card pops and the full-width lead reads at realistic width.
  decorators: [
    (Story) => (
      <div className="bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof TeamEnrolmentCta>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Youth team — the visible state. Jersey carries the age group ("U13"). */
export const Youth: Story = {
  args: {
    teamType: "youth",
    teamSlug: "kcvv-elewijt-u13",
    ageGroup: "U13",
  },
};

/**
 * Youth team whose age string yields no normalised age group (e.g. age =
 * "jeugd"). The jersey renders without a chest letter. VR disabled — the only
 * delta from `Youth` is the absent overlay; one visible baseline is enough.
 */
export const YouthNoChestLetter: Story = {
  args: {
    teamType: "youth",
    teamSlug: "kcvv-elewijt-jeugd",
    ageGroup: undefined,
  },
  parameters: { vr: { disable: true } },
};

/**
 * Senior team (A/B-ploeg) — renders nothing. Senior recruitment runs via
 * trials/contact. VR disabled (nothing to snapshot).
 */
export const Senior: Story = {
  args: {
    teamType: "senior",
    teamSlug: "kcvv-elewijt-a",
    ageGroup: undefined,
  },
  parameters: { vr: { disable: true } },
};
