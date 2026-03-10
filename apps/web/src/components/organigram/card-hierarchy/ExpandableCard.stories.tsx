import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ExpandableCard } from "./ExpandableCard";
import { staffMembersFixture } from "@/components/organigram/__fixtures__/staff-members.fixture";

const president = staffMembersFixture.find((n) => n.id === "president") ?? {
  id: "president",
  name: "Voorzitter",
  title: "Voorzitter",
};
const vicePresident = staffMembersFixture.find(
  (n) => n.id === "vice-president",
) ?? {
  id: "vice-president",
  name: "Ondervoorzitter",
  title: "Ondervoorzitter",
};
const secretary = staffMembersFixture.find((n) => n.id === "secretary") ?? {
  id: "secretary",
  name: "Secretaris",
  title: "Secretaris",
};

const meta = {
  title: "Features/Organigram/ExpandableCard",
  component: ExpandableCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    onToggle: fn(),
    onMemberClick: fn(),
  },
} satisfies Meta<typeof ExpandableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed card — direct reports count shown but children hidden. */
export const Collapsed: Story = {
  args: {
    member: president,
    directReports: [vicePresident, secretary],
    depth: 0,
    isExpanded: false,
  },
};

/** Expanded card with visible direct reports. */
export const Expanded: Story = {
  args: {
    member: president,
    directReports: [vicePresident, secretary],
    depth: 0,
    isExpanded: true,
  },
};

/** Leaf node — no direct reports, no expand toggle shown. */
export const LeafNode: Story = {
  args: {
    member: secretary,
    directReports: [],
    depth: 1,
    isExpanded: false,
  },
};

/** Deeply nested card (depth 3). */
export const DeepNesting: Story = {
  args: {
    member: secretary,
    directReports: [],
    depth: 3,
    isExpanded: false,
  },
};

/** Card with minimal data — no email, phone, or image. */
export const MinimalData: Story = {
  args: {
    member: { id: "x", name: "Onbekend Lid", title: "Vrijwilliger" },
    directReports: [],
    depth: 0,
    isExpanded: false,
  },
};
