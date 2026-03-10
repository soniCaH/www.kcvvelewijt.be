import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MobileNavigationDrawer } from "./MobileNavigationDrawer";
import { staffMembersFixture as clubStructure } from "@/components/organigram/__fixtures__/staff-members.fixture";

const members = clubStructure.filter((n) => n.parentId !== null).slice(0, 12);

const meta = {
  title: "Features/Organigram/MobileNavigationDrawer",
  component: MobileNavigationDrawer,
  parameters: {
    layout: "fullscreen",
  },
  globals: {
    viewport: { value: "mobile1" },
  },
  tags: ["autodocs"],
  args: {
    onClose: fn(),
    onMemberSelect: fn(),
  },
} satisfies Meta<typeof MobileNavigationDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Drawer open — full member list for mobile navigation. */
export const Open: Story = {
  args: {
    members,
    isOpen: true,
  },
};

/** Drawer closed — renders nothing. */
export const Closed: Story = {
  args: {
    members,
    isOpen: false,
  },
};

/** Empty member list. */
export const Empty: Story = {
  args: {
    members: [],
    isOpen: true,
  },
};
