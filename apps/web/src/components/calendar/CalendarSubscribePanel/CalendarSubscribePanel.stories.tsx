import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent } from "storybook/test";
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
  tags: ["autodocs"],
  args: {
    teams,
    isOpen: true,
  },
} satisfies Meta<typeof CalendarSubscribePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {},
};

export const PrefilledSingleTeam: Story = {
  args: {
    preselectedTeamLabel: "A-ploeg",
  },
};

export const WithQRCodeOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Toon QR-code/i }),
    );
  },
};

export const CopiedFeedback: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Kopieer link/i }),
    );
  },
};
