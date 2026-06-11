import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StructureDirectory } from "./StructureDirectory";
import { staffMembersFixture } from "@/components/organigram/__fixtures__/staff-members.fixture";

const meta = {
  title: "Features/Organigram/StructureDirectory",
  component: StructureDirectory,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-cream mx-auto max-w-[64rem] p-6 sm:p-10">
        <Story />
      </div>
    ),
  ],
  args: { nodes: staffMembersFixture },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof StructureDirectory>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Positions grouped by afdeling — every position shown (no cap), incl. the
 * fixture's real vacant (Sponsorverantwoordelijke) + shared (Co-Penningmeester).
 */
export const Default: Story = {};

/**
 * The hub variant (Phase 4, #2055): each card is a focusable button (canonical
 * press-down hover) that opens the `<MemberDetailPanel>` via the hub's
 * click-delegation. Wrap in `<HubMemberPanel>` on the page to make it open.
 */
export const Interactive: Story = {
  args: { interactive: true },
};
