import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { OrganigramExplorer } from "./OrganigramExplorer";
import { explorerFixture } from "./organigram-explorer.fixture";

const meta = {
  title: "Features/Organigram/OrganigramExplorer",
  component: OrganigramExplorer,
  parameters: { layout: "fullscreen" },
  args: { nodes: explorerFixture, open: true, onClose: fn() },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof OrganigramExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default opening view — lands on the primary top node (Voorzitter, 11 children). */
export const Opening: Story = {};

/** The synthetic club root — reachable via the breadcrumb; shows both top lines (GC + Voorzitter). */
export const ClubRoot: Story = {
  args: { initialFocusId: "club" },
};

/** A deep + wide node (TVJO, 12 children at level 4) — count-then-expand fan + breadcrumb. */
export const DeepWideNode: Story = {
  args: { initialFocusId: "tvjo" },
};

/** A node with many siblings — the sibling cycler + "n / N" indicator. */
export const ManySiblings: Story = {
  args: { initialFocusId: "secretaris" },
};

/** A vacant position centred — warm recruit chrome, no profile link. */
export const VacantNode: Story = {
  args: { initialFocusId: "ouderraad" },
};

/** A shared position centred — "N personen". */
export const SharedNode: Story = {
  args: { initialFocusId: "kledij" },
};

/**
 * Phase 4 (#2055) "trigger + consolidate": with `onOpenMember` wired, the centred
 * node shows a "Contactgegevens" trigger (opens the `<MemberDetailPanel>` over the
 * verkenner) instead of the inline profile link + shared-member list.
 */
export const WithContactTrigger: Story = {
  args: { onOpenMember: fn() },
};
