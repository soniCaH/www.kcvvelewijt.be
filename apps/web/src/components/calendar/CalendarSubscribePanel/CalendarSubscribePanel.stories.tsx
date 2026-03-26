import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
  render: (args) => {
    function Wrapper() {
      return (
        <div>
          <CalendarSubscribePanel {...args} />
          <p className="text-sm text-gray-500 mt-2">
            Click &quot;Toon QR-code&quot; to see the QR code.
          </p>
        </div>
      );
    }
    return <Wrapper />;
  },
};

export const CopiedFeedback: Story = {
  render: (args) => {
    function Wrapper() {
      return (
        <div>
          <CalendarSubscribePanel {...args} />
          <p className="text-sm text-gray-500 mt-2">
            Click &quot;Kopieer link&quot; to see the confirmation.
          </p>
        </div>
      );
    }
    return <Wrapper />;
  },
};
