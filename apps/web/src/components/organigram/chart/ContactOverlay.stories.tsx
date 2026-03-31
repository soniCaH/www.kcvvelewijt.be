import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ContactOverlay } from "./ContactOverlay";
import { staffMembersFixture } from "@/components/organigram/__fixtures__/staff-members.fixture";

const president = staffMembersFixture.find((n) => n.id === "president") ?? {
  id: "president",
  title: "Voorzitter",
  members: [{ id: "staff-president", name: "Voorzitter" }],
};
const minimal = {
  id: "x",
  title: "Vrijwilliger",
  members: [{ id: "staff-x", name: "Jan Janssen" }],
};
const vacant = staffMembersFixture.find(
  (n) => n.id === "sponsor-coordinator",
) ?? {
  id: "vacant",
  title: "Sponsorverantwoordelijke",
  description: "Sponsorwerving.",
  members: [],
};
const shared = staffMembersFixture.find((n) => n.id === "co-treasurers") ?? {
  id: "shared",
  title: "Co-Penningmeester",
  members: [
    { id: "a", name: "Els" },
    { id: "b", name: "Tom" },
  ],
};

const meta = {
  title: "Features/Organigram/ContactOverlay",
  component: ContactOverlay,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Floating overlay shown when a node is hovered/clicked in the org chart. Positioned relative to the node.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    onClose: fn(),
    onViewDetails: fn(),
  },
} satisfies Meta<typeof ContactOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultPosition = { x: 100, y: 100 };

/** Full member data with email, phone, and "View details" link. */
export const Visible: Story = {
  args: {
    member: president,
    isVisible: true,
    position: defaultPosition,
  },
};

/** Minimal member — name and title only, no contact fields. */
export const MinimalMember: Story = {
  args: {
    member: minimal,
    isVisible: true,
    position: defaultPosition,
  },
};

/** Overlay hidden (isVisible=false) — renders nothing. */
export const Hidden: Story = {
  args: {
    member: president,
    isVisible: false,
    position: defaultPosition,
  },
  parameters: {
    docs: {
      description: {
        story:
          "When `isVisible` is false the component returns null — the canvas is intentionally blank.",
      },
    },
  },
};

/** Vacant position — no members, shows description only. */
export const VacantNode: Story = {
  args: {
    member: vacant,
    isVisible: true,
    position: defaultPosition,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Vacant position with 0 members. Shows position title, vacant indicator, and description text.",
      },
    },
  },
};

/** Shared position — 2+ members with per-member contact blocks. */
export const SharedNode: Story = {
  args: {
    member: shared,
    isVisible: true,
    position: defaultPosition,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shared position with 2 members. Shows position title as header and individual contact blocks per member.",
      },
    },
  },
};
