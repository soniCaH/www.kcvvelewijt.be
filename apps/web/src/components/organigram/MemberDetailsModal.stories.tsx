import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MemberDetailsModal } from "./MemberDetailsModal";
import type { OrgChartNode } from "@/types/organigram";
import { staffMembersFixture } from "@/components/organigram/__fixtures__/staff-members.fixture";

const meta = {
  title: "Features/Organigram/MemberDetailsModal",
  component: MemberDetailsModal,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 600,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    onClose: fn(),
  },
  argTypes: {
    isOpen: { control: "boolean" },
  },
} satisfies Meta<typeof MemberDetailsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockMember: OrgChartNode = {
  id: "1",
  title: "Voorzitter",
  roleCode: "VOOR",
  department: "hoofdbestuur",
  description:
    "Algemene leiding van de club. Vertegenwoordiging bij de bond en gemeente. Financieel beleid.",
  members: [
    {
      id: "staff-1",
      name: "Jean-Pierre Van Rossem",
      email: "jp.vanrossem@kcvv.be",
      phone: "+32 470 12 34 56",
      href: "/staff/jp-vanrossem",
    },
  ],
};

const vacantMember = staffMembersFixture.find(
  (n) => n.id === "sponsor-coordinator",
) ?? {
  id: "vacant",
  title: "Sponsorverantwoordelijke",
  description: "Sponsorwerving.",
  members: [],
};

const sharedMember = staffMembersFixture.find(
  (n) => n.id === "co-treasurers",
) ?? {
  id: "shared",
  title: "Co-Penningmeester",
  members: [
    { id: "a", name: "Els" },
    { id: "b", name: "Tom" },
  ],
};

export const Open: Story = {
  args: {
    isOpen: true,
    member: mockMember,
  },
};

export const MinimalData: Story = {
  args: {
    isOpen: true,
    member: {
      id: "2",
      title: "Lid",
      members: [{ id: "staff-2", name: "John Doe" }],
    },
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    member: mockMember,
  },
};

export const MobileView: Story = {
  args: {
    isOpen: true,
    member: mockMember,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

/** Vacant position — no members, shows description only. */
export const VacantNode: Story = {
  args: {
    isOpen: true,
    member: vacantMember,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Vacant position with 0 members. Shows position title, vacant indicator, and description.",
      },
    },
  },
};

/** Shared position — 2 co-holders with per-member contact cards. */
export const SharedNode: Story = {
  args: {
    isOpen: true,
    member: sharedMember,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shared position with 2 members. Shows position title in header and per-member contact cards with profile links.",
      },
    },
  },
};
