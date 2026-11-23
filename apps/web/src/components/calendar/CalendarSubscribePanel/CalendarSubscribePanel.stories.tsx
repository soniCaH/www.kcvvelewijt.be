import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent, spyOn } from "storybook/test";
import { blurActive } from "@test-storybook/blurActive";
import { CalendarSubscribePanel } from "./CalendarSubscribePanel";
import type { CalendarTeamInfo } from "@/app/(main)/kalender/utils";

const teams: CalendarTeamInfo[] = [
  { id: "t1", name: "A-ploeg", psdId: 101, label: "A-ploeg" },
  { id: "t2", name: "B-ploeg", psdId: 102, label: "B-ploeg" },
  { id: "t3", name: "U15 A", psdId: 103, label: "U15 A" },
  { id: "t4", name: "U13 A", psdId: 104, label: "U13 A" },
];

const meta = {
  title: "Features/Calendar/CalendarSubscribePanel",
  component: CalendarSubscribePanel,
  parameters: { layout: "padded" },
  tags: ["autodocs", "vr"],
  args: {
    teams,
    isOpen: true,
  },
} satisfies Meta<typeof CalendarSubscribePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ────────────────────────────────────────────────────────────────

export const Default: Story = {
  // Club-activities switch is on by default (#2705).
  args: {},
};

export const ActivitiesOff: Story = {
  // The switch turned off — the copied link/QR drop back to the matches-only
  // webcal URL that predates #2704/#2705.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("switch", { name: /clubactiviteiten/i }),
    );
    blurActive(canvasElement);
  },
};

export const PrefilledSingleTeam: Story = {
  args: {
    preselectedTeamId: "t1",
  },
};

export const CopiedFeedback: Story = {
  // Excluded from VR: the play-state depends on the clipboard write resolving,
  // which is permission-dependent in the headless runner — the snapshot would be
  // non-deterministic. Kept for autodocs/interaction coverage.
  tags: ["vr-skip"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Kopieer link/i }),
    );
    blurActive(canvasElement);
  },
};

/**
 * The clipboard write rejects (#2580) — Tier 2 failure notice, no action (the
 * copy button is its own retry). Unlike `CopiedFeedback`, forcing the
 * rejection makes this deterministic, so it stays in the VR set.
 */
export const CopyFailed: Story = {
  beforeEach: () => {
    // storybook/test restores spies between stories automatically.
    spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Kopieer link/i }),
    );
    await canvas.findByRole("alert");
    blurActive(canvasElement);
  },
};
