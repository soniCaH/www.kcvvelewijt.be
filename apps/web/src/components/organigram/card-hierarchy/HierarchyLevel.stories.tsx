import type { ComponentProps } from "react";
import type { StoryObj } from "@storybook/nextjs-vite";
import { HierarchyLevel } from "./HierarchyLevel";
import { staffMembersFixture as clubStructure } from "@/components/organigram/__fixtures__/staff-members.fixture";

// True roots only — nodes with parentId === null.
// Including parentId === "club" children here causes them to be rendered twice
// when those children are also shown as expanded sub-nodes.
const topLevel = clubStructure.filter((n) => n.parentId === null);

// expandedIds is Set<string> in the component but arrays are JSON-serialisable.
// StoryArgs overrides the prop so Controls can edit/serialize expandedIds.
type StoryArgs = Omit<ComponentProps<typeof HierarchyLevel>, "expandedIds"> & {
  expandedIds: string[];
};

const meta = {
  title: "Features/Organigram/HierarchyLevel",
  component: HierarchyLevel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    onToggle: { action: "toggled" },
    onMemberClick: { action: "member-clicked" },
  },
};

export default meta;
// Story is typed against StoryArgs (string[] expandedIds) while meta keeps
// the real component reference for autodocs generation.
type Story = StoryObj<StoryArgs>;

function renderWithSet({ expandedIds, ...args }: StoryArgs) {
  return <HierarchyLevel {...args} expandedIds={new Set(expandedIds)} />;
}

/** Top-level nodes at depth 0, all collapsed. */
export const Default: Story = {
  args: {
    members: topLevel,
    allMembers: clubStructure,
    depth: 0,
    expandedIds: [],
  },
  render: renderWithSet,
};

/** All nodes expanded (uses full clubStructure). */
export const AllExpanded: Story = {
  args: {
    members: topLevel,
    allMembers: clubStructure,
    depth: 0,
    expandedIds: clubStructure.map((n) => n.id),
  },
  render: renderWithSet,
};

/** Single node at depth 2. */
export const SingleNode: Story = {
  args: {
    members: clubStructure.filter((n) => n.id === "president"),
    allMembers: clubStructure,
    depth: 2,
    expandedIds: [],
  },
  render: renderWithSet,
};
