import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OrganigramOverview } from "./OrganigramOverview";
import { explorerFixture } from "./organigram-explorer.fixture";

const meta = {
  title: "Features/Organigram/OrganigramOverview",
  component: OrganigramOverview,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream min-h-screen p-6">
        <Story />
      </div>
    ),
  ],
  args: { nodes: explorerFixture },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof OrganigramOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The full box chart wired to the explorer — click any node (or "Blader door het organigram
 * ⤢") to open the fullscreen spotlight focused there; "Download als PDF" prints
 * the whole tree on one A4.
 */
export const Default: Story = {};
